from django.contrib.auth import authenticate, login, logout, get_user_model
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required, user_passes_test
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
import json
from django.views.decorators.csrf import csrf_exempt
from django_ratelimit.decorators import ratelimit
from django.views.decorators.http import require_POST, require_GET
from django_ratelimit.exceptions import Ratelimited
import logging

logger = logging.getLogger("accounts")

User = get_user_model()


@csrf_exempt
@require_POST
@ratelimit(key="user_or_ip", rate="50/h", method=["POST"])
def login_view(request):
    try:
        if request.method == "POST":
            logger.debug("Login attempt received")

            # Parse the JSON body
            data = json.loads(request.body)
            username = data.get("username")
            password = data.get("password")

            logger.debug(f"Login attempt for username: {username}")

            # Authenticate the user
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                logger.info(f"User {username} logged in successfully")
                return JsonResponse({"message": "Login successful"}, status=200)
            else:
                logger.warning(f"Failed login attempt for username: {username}")
                return JsonResponse(
                    {"error": "Invalid username or password"}, status=400
                )

    except json.JSONDecodeError:
        logger.error("JSON decoding error during login attempt", exc_info=True)
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    except Ratelimited:
        logger.warning("Rate limit exceeded for login attempt", exc_info=True)
        return JsonResponse({"error": "Rate limit exceeded"}, status=429)

    except Exception as e:
        logger.error(f"Unexpected error during login: {str(e)}", exc_info=True)
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@login_required
@require_POST
@ratelimit(key="user_or_ip", rate="50/h", method=["POST"])
def logout_view(request):
    try:
        if request.method == "POST":
            # Log the user logout attempt
            logger.info(f"Logout attempt by user: {request.user.username}")

            # Perform the logout
            logout(request)
            logger.info(f"User {request.user.username} logged out successfully")

            return JsonResponse({"message": "Logout successful"}, status=200)

        else:
            # Log invalid method usage
            logger.warning(
                f"Invalid method {request.method} used in logout attempt by user: {request.user.username}"
            )
            return JsonResponse({"error": "Method not allowed"}, status=405)

    except Ratelimited:
        # Log rate limit exceeded
        logger.warning(f"Rate limit exceeded for user: {request.user.username}")
        return JsonResponse({"error": "Rate limit exceeded"}, status=429)

    except Exception as e:
        # Log any unexpected errors
        logger.error(
            f"Unexpected error during logout for user: {request.user.username}: {e}",
            exc_info=True,
        )
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_GET
@ratelimit(key="user_or_ip", rate="100/h", method=["GET"])
def check_login_status(request):
    # Get the session ID from cookies
    session_id = request.COOKIES.get("sessionid")

    # Log the session ID if present
    if session_id:
        logger.info(f"Session ID found: {session_id}")
    else:
        logger.warning("No session ID found in cookies.")

    try:
        # Check if the user is authenticated
        if request.user.is_authenticated:
            logger.info(f"User {request.user.username} is authenticated.")
            return JsonResponse({"message": "User is logged in"}, status=200)
        else:
            logger.info("User is not authenticated.")
            return JsonResponse({"message": "User is not logged in"}, status=200)

    except Ratelimited:
        # Log rate limit exceeded
        logger.warning(f"Rate limit exceeded for session: {session_id}")
        return JsonResponse({"error": "Rate limit exceeded"}, status=429)

    except Exception as e:
        # Log unexpected errors
        logger.error(
            f"Unexpected error while checking login status: {e}", exc_info=True
        )
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_POST
@ratelimit(key="user_or_ip", rate="10/h", method=["POST"])
def register_view(request):
    try:
        if request.method == "POST":
            try:
                # Parse the request body
                data = json.loads(request.body)
                username = data.get("username")
                email = data.get("email")
                password = data.get("password")

                # Validate input
                if not username or not email or not password:
                    logger.warning(f"Missing fields in registration data: {data}")
                    return JsonResponse(
                        {"error": "All fields are required"}, status=400
                    )

                # Validate email format
                try:
                    validate_email(email)
                except ValidationError:
                    logger.warning(f"Invalid email address provided: {email}")
                    return JsonResponse({"error": "Invalid email address"}, status=400)

                # Check if username or email already exists
                if User.objects.filter(username=username).exists():
                    logger.warning(f"Username already taken: {username}")
                    return JsonResponse({"error": "Username already taken"}, status=400)

                if User.objects.filter(email=email).exists():
                    logger.warning(f"Email already registered: {email}")
                    return JsonResponse(
                        {"error": "Email already registered"}, status=400
                    )

                # Create the new user
                user = User.objects.create_user(
                    username=username, email=email, password=password
                )

                # Log successful registration
                logger.info(f"New user registered: {username} ({email})")

                return JsonResponse(
                    {
                        "message": "User created successfully",
                        "username": user.username,
                        "email": user.email,
                    },
                    status=201,
                )

            except json.JSONDecodeError:
                logger.error("Invalid JSON in registration request", exc_info=True)
                return JsonResponse({"error": "Invalid JSON"}, status=400)
        else:
            logger.warning(f"Invalid method {request.method} for registration attempt")
            return JsonResponse({"error": "Method not allowed"}, status=405)

    except Ratelimited:
        logger.warning("Rate limit exceeded for registration attempt")
        return JsonResponse({"error": "Rate limit exceeded"}, status=429)

    except Exception as e:
        logger.error(f"Unexpected error during registration: {e}", exc_info=True)
        return JsonResponse({"error": str(e)}, status=500)


@login_required
@csrf_exempt
@ratelimit(key="user_or_ip", rate="10/h", method=["DELETE"])
def delete_user_view(request):
    try:
        if request.method == "DELETE":
            user = request.user

            # Log the deletion request
            logger.info(
                f"User deletion requested for user: {user.username} (ID: {user.id})"
            )

            # Delete the user
            user.delete()

            # Log successful deletion
            logger.info(f"User {user.username} (ID: {user.id}) deleted successfully")

            return JsonResponse({"message": "User deleted successfully"}, status=200)
        else:
            # Log an invalid request method
            logger.warning(
                f"Invalid request method {request.method} for user deletion by user: {request.user.username}"
            )
            return JsonResponse({"error": "Invalid request method"}, status=400)

    except Ratelimited:
        # Log rate limit exceeded
        logger.warning(f"Rate limit exceeded for user: {request.user.username}")
        return JsonResponse({"error": "Rate limit exceeded"}, status=429)

    except Exception as e:
        # Log any unexpected errors
        logger.error(
            f"Unexpected error during user deletion for user: {request.user.username}: {e}",
            exc_info=True,
        )
        return JsonResponse({"error": str(e)}, status=500)


def is_admin(user):
    return user.is_staff or user.is_superuser


@user_passes_test(is_admin)
@login_required
@csrf_exempt
@ratelimit(key="user_or_ip", rate="10/h", method=["DELETE"])
def deactivate_user(request, username):
    try:
        # Attempt to retrieve the user
        user = User.objects.get(username=username)

        # Deactivate the user
        user.is_active = False
        user.save()

        # Log successful deactivation
        logger.info(f"User {username} has been deactivated.")

        return JsonResponse(
            {"message": f"User {username} has been deactivated."}, status=200
        )

    except User.DoesNotExist:
        # Log user not found
        logger.warning(f"Attempt to deactivate non-existent user: {username}")

        return JsonResponse({"error": "User not found"}, status=404)

    except Ratelimited:
        # Log rate limit exceeded
        logger.warning(
            f"Rate limit exceeded during deactivation attempt for user: {username}"
        )

        return JsonResponse({"error": "Rate limit exceeded"}, status=429)

    except Exception as e:
        # Log any unexpected errors
        logger.error(
            f"Unexpected error during deactivation of user {username}: {e}",
            exc_info=True,
        )

        return JsonResponse({"error": str(e)}, status=500)
