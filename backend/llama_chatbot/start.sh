# Start Memcached
memcached -u memcache &
# Wait for Memcached to start
sleep 5
# Start Ollama server
ollama serve &
# Start Django server
python manage.py runserver 0.0.0.0:8000