FROM nginx:1.27-alpine

RUN apk add --no-cache keepalived bash curl

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY keepalived-master.conf /etc/keepalived/keepalived-master.conf
COPY keepalived-backup.conf /etc/keepalived/keepalived-backup.conf
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/entrypoint.sh"]
