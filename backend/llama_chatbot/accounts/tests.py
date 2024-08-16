from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()


class AuthViewsTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.register_url = reverse("register")
        self.login_url = reverse("login")
        self.logout_url = reverse("logout")
        self.delete_url = reverse("delete_user")
        self.deactivate_url = reverse("deactivate_user", args=["testuser"])

        # Create a test user
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="password123"
        )

    def test_register_view(self):
        response = self.client.post(
            self.register_url,
            {
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "newpassword123",
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn("username", response.json())
        self.assertIn("email", response.json())

    def test_login_view(self):
        response = self.client.post(
            self.login_url,
            {"username": "testuser", "password": "password123"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("Login successful", response.json()["message"])

    def test_login_view_invalid_credentials(self):
        response = self.client.post(
            self.login_url,
            {"username": "testuser", "password": "wrongpassword"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid username or password", response.json()["error"])

    def test_logout_view(self):
        self.client.login(username="testuser", password="password123")
        response = self.client.post(self.logout_url, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        self.assertIn("Logout successful", response.json()["message"])

    def test_delete_user_view(self):
        self.client.login(username="testuser", password="password123")
        response = self.client.delete(self.delete_url, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        self.assertIn("User deleted successfully", response.json()["message"])
        with self.assertRaises(User.DoesNotExist):
            User.objects.get(username="testuser")

    def test_deactivate_user_view(self):
        admin_user = User.objects.create_superuser(
            username="admin", email="admin@example.com", password="adminpassword"
        )
        self.client.login(username="admin", password="adminpassword")
        response = self.client.post(
            self.deactivate_url, content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("User testuser has been deactivated.", response.json()["message"])
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)
