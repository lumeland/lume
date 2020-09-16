/**
 * Execute callbacks to a iterator in parallel
 */
export async function parallel(iterator, callback) {
  return Promise.all(
    Array.from(iterator).map((entry) => {
      try {
        return callback(entry);
      } catch (err) {
        console.error(`Error in: ${entry}:`);
        console.error(err);
      }
    }),
  );
}
