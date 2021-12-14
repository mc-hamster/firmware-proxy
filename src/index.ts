import { writeAll } from 'https:/deno.land/std@0.117.0/streams/conversion.ts';
import { Application, Router } from 'https:/deno.land/x/oak@v10.0.0/mod.ts';
import { decompress } from 'https:/deno.land/x/zip@v1.2.2/mod.ts';

const buildUrl = (version?: string) => {
  return version
    ? `https://github.com/meshtastic/Meshtastic-device/releases/download/v${version}/firmware-${version}.zip`
    : "https://nightly.link/meshtastic/meshtastic-device/workflows/main/master/built.zip";
};

const sanatizeInput = (releaseType: string, id: string, variant: string) => {
  const acceptableReleaseType = new Set(["commit", "release"]);
  const acceptableVariant = new Set([
    "heltec-v2.0",
    "heltec-v2.1",
    "meshtastic-diy-v1",
    "rak4631_5005",
    "rak4631_19003",
    "tbeam0.7",
    "tbeam",
    "t-echo",
    "tlora_v1_3",
    "tlora-v1",
    "tlora-v2",
    "tlora-v2-1-1.6",
  ]);

  return (
    acceptableReleaseType.has(releaseType) &&
    acceptableVariant.has(variant) &&
    id.length < 30
  );
};

const router = new Router();

router.get("/:releaseType/:id/:variant", async (context) => {
  const { releaseType, id, variant } = context.params;
  if (!sanatizeInput(releaseType, id, variant)) {
    context.response.status = 400;
    context.response.body = "Invalid input";
    return;
  }

  console.log(`Requested: ${releaseType} ${id} ${variant}`);

  try {
    Deno.readDirSync(`/tmp/${id}/`);
  } catch (_) {
    let zipData = new Uint8Array();

    const response = await fetch(buildUrl(id), {
      headers: {
        Accept: "application/vnd.github.3.raw",
      },
    });
    zipData = new Uint8Array(await response.arrayBuffer());

    const file = await Deno.create(`/tmp/${id}.zip`);
    await writeAll(file, zipData);
    await decompress(`/tmp/${id}.zip`, `/tmp/${id}`);
  }

  context.response.type = "application/octet-stream";
  context.response.headers.append(
    "Content-Disposition",
    `attachment; filename="firmware-${variant}-${id}.bin"`
  );
  context.response.body = await Deno.open(
    `/tmp/${id}/firmware-${variant}-${id}.bin`
  );
});

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: parseInt(Deno.env.get("PORT") ?? "8000") });
