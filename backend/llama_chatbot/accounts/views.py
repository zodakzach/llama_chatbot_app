from django.contrib.auth import authenticate, login, logout, get_user_model
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required, user_passes_test
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
import json
from django.views.decorators.csrf import csrf_exempt
from django_ratelimit.decorators import ratelimit
from django.views.decorators.http import require_POST, require_GET
from django_ratelimit.exceptions import RateLimitExceeded


User = get_user_model()


@csrf_exempt
@require_POST
@ratelimit(key='user_or_ip', rate='50/h', method=['POST'])
def login_view(request):
    try:
        if request.method == "POST":
            data = json.loads(request.body)
            username = data.get("username")
            password = data.get("password")

            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return JsonResponse({"message": "Login successful"}, status=200)
            else:
                return JsonResponse(
                    {"error": "Invalid username or password"}, status=400
                )
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except RateLimitExceeded:
        return JsonResponse({"error": "Rate limit exceeded"}, status=429)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@login_required
@require_POST
@ratelimit(key='user_or_ip', rate='50/h', method=['POST'])
def logout_view(request):
    try:
        if request.method == "POST":
            logout(request)
            return JsonResponse({"message": "Logout successful"}, status=200)
        else:
            return JsonResponse({"error": "Method not allowed"}, status=405)
    except RateLimitExceeded:
        return JsonResponse({"error": "Rate limit exceeded"}, status=429)


@csrf_exempt
@require_GET
@ratelimit(key='user_or_ip', rate='100/h', method=['GET'])
def check_login_status(request):
    try:
        if request.user.is_authenticated:
            return JsonResponse({"message": "User is logged in"}, status=200)
        else:
            return JsonResponse({"message": "User is not logged in"}, status=200)
    except RateLimitExceeded:
        return JsonResponse({"error": "Rate limit exceeded"}, status=429)


@csrf_exempt
@require_POST
@ratelimit(key='user_or_ip', rate='10/h', method=['POST'])
def register_view(request):
    try:
        if request.method == "POST":
            try:
                data = json.loads(request.body)
                username = data.get("username")
                email = data.get("email")
                password = data.get("password")

                # Validate input
                if not username or not email or not password:
                    return JsonResponse({"error": "All fields are required"}, status=400)

                # Check email validity
                try:
                    validate_email(email)
                except ValidationError:
                    return JsonResponse({"error": "Invalid email address"}, status=400)

                # Check if username or email already exists
                if User.objects.filter(username=username).exists():
                    return JsonResponse({"error": "Username already taken"}, status=400)
                if User.objects.filter(email=email).exists():
                    return JsonResponse({"error": "Email already registered"}, status=400)

                # Create new user
                user = User.objects.create_user(
                    username=username, email=email, password=password
                )
                return JsonResponse(
                    {
                        "message": "User created successfully",
                        "username": user.username,
                        "email": user.email,
                    },
                    status=201,
                )

            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid JSON"}, status=400)
        else:
            return JsonResponse({"error": "Method not allowed"}, status=405)
    except RateLimitExceeded:
        return JsonResponse({"error": "Rate limit exceeded"}, status=429)


@login_required
@csrf_exempt
@ratelimit(key='user_or_ip', rate='10/h', method=['DELETE'])
def delete_user_view(request):
    try:
        if request.method == "DELETE":
            user = request.user
            user.delete()
            return JsonResponse({"message": "User deleted successfully"}, status=200)
        else:
            return JsonResponse({"error": "Invalid request method"}, status=400)
    except RateLimitExceeded:
        return JsonResponse({"error": "Rate limit exceeded"}, status=429)


def is_admin(user):
    return user.is_staff or user.is_superuser


@user_passes_test(is_admin)
@login_required
@csrf_exempt
@ratelimit(key='user_or_ip', rate='10/h', method=['DELETE'])
def deactivate_user(request, username):
    try:
        user = User.objects.get(username=username)
        user.is_active = False
        user.save()
        return JsonResponse(
            {"message": f"User {username} has been deactivated."}, status=200
        )
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except RateLimitExceeded:
        return JsonResponse({"error": "Rate limit exceeded"}, status=429)
