# Use Python 3.12 as a base image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies and clean up
RUN apt-get update && \
    apt-get install -y \
        build-essential \
        libpq-dev \
        libmemcached-dev \ 
        libz-dev \
        curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Nginx for reverse proxy
RUN apt-get update && apt-get install -y nginx

# Copy the requirements file and install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy the Django project files to the container
COPY . /app/

# Copy Nginx configuration file
COPY nginx.conf /etc/nginx/nginx.conf

# Expose the port the app runs on
EXPOSE 80
EXPOSE 443

# Command to run the Django development server with SSL
# CMD ["python", "manage.py", "runserver_plus", "--cert-file", "/certs/localhost.pem", "--key-file", "/certs/localhost-key.pem", "0.0.0.0:443"]

# Run gunicorn server in the background and start Nginx
CMD ["bash", "-c", "gunicorn --bind 0.0.0.0:8000 --workers 4 llama_chatbot.wsgi:application & nginx -g 'daemon off;'"]
