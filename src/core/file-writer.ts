export async function writeFile(directory: FileSystemDirectoryHandle, filename: string, content: Blob | string): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let writer: FileSystemWritableFileStream | undefined;
    try {
      const file = await directory.getFileHandle(filename, { create: true });
      writer = await file.createWritable();
      await writer.write(content);
      await writer.close();
      return;
    } catch (error) {
      await writer?.abort().catch(() => undefined);
      const name = error instanceof Error ? error.name : '';
      if (!['InvalidStateError', 'NotReadableError', 'NoModificationAllowedError'].includes(name) || attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
    }
  }
}
