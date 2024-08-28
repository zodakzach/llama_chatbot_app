# Django Llama Chatbot Backend

A Django-based backend API for a chat application, featuring:

* **User Authentication**: Login, logout, and registration endpoints
* **Chat Threads**: Create, read, update, and delete chat threads
* **LLaMA Model Integration**: Get responses from the LLaMA model via Ollama API calls
* **Memcache**: Utilizes Memcache for caching and rate limiting
* **Rate Limiting**: Implemented using Django Ratelimit to prevent abuse
* **CORS**: Configured to allow cross-origin requests from frontend applications

Built using Django, Django Ollama, Django CORS Headers, Django Ratelimit, and Django Pylibmc.
## Table of Contents

* [Requirements](#requirements)
* [Installation](#installation)
* [Configuration](#configuration)
* [Running the Project](#running-the-project)
* [API Documentation](#api-documentation)
* [Testing](#testing)

## Requirements

* Python 3.x
* Django 3.x
* Memcache
* ollama
* python-dotenv
* django-cors-headers
* django-ratelimit
* django-pylibmc

## Installation

1. Clone the repository: `git clone https://github.com/zodakzach/llama_chatbot_app.git`
2. Install dependencies: `pip install -r requirements.txt`
3. Run migrations: `python manage.py migrate`

## Configuration

To configure the project, you need to set the following environment variables:

* `OLLAMA_HOST`: The URL of your Ollama instance.
* `CACHE_BACKEND`: The cache backend to use.
* `CACHE_LOCATION`: The location of your cache instance.

## Running the Project

* Start the development server: `python manage.py runserver`

## API Documentation

### Chat API

* **Streaming Response**: `/chat/streaming-response/<int:thread_id>/`
	+ Get a streaming response from the LLaMA model
* **Get Response**: `/chat/response/<int:thread_id>/`
	+ Get a response from the LLaMA model
* **Get Thread Messages**: `/chat/threads/<int:thread_id>/messages/`
	+ Get all messages for a specific thread
* **Start New Thread**: `/chat/threads/new/`
	+ Start a new chat thread
* **Get User Threads**: `/chat/threads/`
	+ Get all threads for the logged-in user
* **Update Thread Title**: `/chat/threads/<int:thread_id>/update-title/`
	+ Update the title of a specific thread
* **Delete Thread**: `/chat/threads/<int:thread_id>/delete/`
	+ Delete a specific thread
* **Delete All Threads**: `/chat/threads/delete/`
	+ Delete all threads for user

### Accounts API

* **Login**
	+ `/auth/login/`
	+ Log in to the application
* **Logout**
	+ `/auth/logout/`
	+ Log out of the application
* **Check Login Status**
	+ `/auth/status/`
	+ Check if the user is logged in
* **Register**
	+ `/auth/register/`
	+ Register a new user account
* **Delete User**
	+ `/auth/delete/`
	+ Delete the current user account
* **Deactivate User**
	+ `/auth/deactivate/<str:username>/`
	+ Deactivate a user account by username

## Testing