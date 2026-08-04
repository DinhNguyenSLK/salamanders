FROM python:3.12.6-slim-bookworm

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
COPY ../../collection_dir/config.yaml /collection_dir/
CMD ["python", "-u", "service.py"]

