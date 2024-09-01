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

# Copy the requirements file and install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy the Django project files to the container
COPY . /app/

# Copy the start.sh script to the container
COPY start.sh /app/
RUN chmod +x /app/start.sh

# Expose the port the app runs on
EXPOSE 8000

# Use the start.sh script to start services
CMD ["/app/start.sh"]