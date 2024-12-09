ARG PYTHON_VERSION=3.12

FROM alpine as builder
ARG PYTHON_VERSION

# Add libffi for ctypes support, along with py3-pip and zlib
RUN apk add --no-cache python3~=${PYTHON_VERSION} py3-pip zlib libffi

WORKDIR /usr/lib/python${PYTHON_VERSION}
RUN python3 -m compileall -o 2 .
RUN find . -name "*.cpython-*.opt-2.pyc" | awk '{print $1, $1}' | sed 's/__pycache__\///2' | sed 's/.cpython-[0-9]\{2,\}.opt-2//2' | xargs -n 2 mv
RUN find . -name "*.py" -delete
RUN find . -name "__pycache__" -exec rm -r {} +

WORKDIR /app
COPY . .
RUN python3 -m venv --copies /app/venv && \
    /app/venv/bin/pip install --no-cache-dir -r requirements.txt

FROM scratch
ARG PYTHON_VERSION

COPY --from=builder /usr/bin/python3 /
COPY --from=builder /lib/ld-musl-x86_64.so.1 /lib/ld-musl-x86_64.so.1
COPY --from=builder /usr/lib/libpython${PYTHON_VERSION}.so.1.0 /usr/lib/libpython${PYTHON_VERSION}.so.1.0
COPY --from=builder /usr/lib/libz.so.1 /usr/lib/libz.so.1
COPY --from=builder /usr/lib/libffi.so.8 /usr/lib/libffi.so.8
COPY --from=builder /usr/lib/python${PYTHON_VERSION}/ /usr/lib/python${PYTHON_VERSION}/
COPY --from=builder /app /app

ENTRYPOINT ["/app/venv/bin/python", "/app/app.py"]
