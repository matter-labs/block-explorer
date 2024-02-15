export default <T>(array: T[], chunkSize = 10) => {
  const chunks = [];
  let currentChunk = 0;
  for (let i = 0; i < array.length; i++) {
    if (chunks[currentChunk] && chunks[currentChunk].length === chunkSize) {
      currentChunk++;
    }
    if (!chunks[currentChunk]) {
      chunks[currentChunk] = [];
    }
    chunks[currentChunk].push(array[i]);
  }
  return chunks;
};
