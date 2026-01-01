import jsMediaTags from "jsmediatags";

export type Mp3Meta = {
  title: string | null;
  coverUrl: string | null; // objectURL
};

type Tags = {
  title?: unknown;
  picture?: unknown;
};

type JsMediaTagsResult = {
  tags?: Tags;
};

const pictureToObjectUrl = (picture: { data: number[] | Uint8Array; format: string }): string => {
  const bytes = picture.data ? picture.data : new Uint8Array(picture.data);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const blob = new Blob([bytes], {type: picture.format});
  return URL.createObjectURL(blob);
};

export const readMp3Meta = (file: File): Promise<Mp3Meta> =>
  new Promise((resolve) => {
    jsMediaTags.read(file, {
      onSuccess: (result) => {
        const jsResult = result as unknown as JsMediaTagsResult;
        const tags = jsResult.tags ?? {};

        const title =
          typeof tags.title === "string" && tags.title.trim()
            ? tags.title.trim()
            : null;

        const picture = tags.picture as { data: number[] | Uint8Array; format: string } | undefined;
        const coverUrl = picture ? pictureToObjectUrl(picture) : null;

        resolve({title, coverUrl});
      },
      onError: () => resolve({title: null, coverUrl: null}),
    });
  });
