from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('status/', views.check_login_status, name='status'),
    path('register/', views.register_view, name='register'),
    path('delete/', views.delete_user_view, name='delete_user'),
    path('deactivate/<str:username>/', views.deactivate_user, name='deactivate_user'),
    # Other URLs...
]
