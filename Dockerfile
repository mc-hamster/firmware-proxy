FROM denoland/deno:1.16.2

WORKDIR /app

USER deno

# These steps will be re-run upon each file change in your working directory:
ADD . .

CMD deno run --allow-net --allow-read --allow-write --unstable src/index.ts