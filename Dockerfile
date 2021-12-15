FROM denoland/deno:1.16.4

WORKDIR /app

USER deno:deno

# These steps will be re-run upon each file change in your working directory:
ADD . .

CMD deno run --allow-net --allow-read --allow-write --allow-env --unstable --allow-run src/index.ts