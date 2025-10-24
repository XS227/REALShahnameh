FROM nginx:1.27-alpine

LABEL org.opencontainers.image.source="https://example.com/REALShahnameh" \
      org.opencontainers.image.title="REAL Shahnameh" \
      org.opencontainers.image.description="Immersive landing page for REAL Shahnameh"

COPY public /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
