FROM migrate/migrate:latest

COPY ./migrations /migrations

COPY ./scripts/migrate.sh /migrate.sh
RUN chmod +x /migrate.sh

CMD ["/migrate.sh"]
# CMD ["sleep", "infinity"]
# CMD ["tail", "-f", "/dev/null"]