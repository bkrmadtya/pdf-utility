export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * @description Formats the array of numbers into array range
 * Eg.: [1,2,3,4....,27]        => `1-7`
 *      [1,2,....21, 35,...100] => `1-21, 35-100`
 */
export const formatNumberToRanges = (numbers: number[], minLength = 5) => {
  if (!numbers || numbers.length === 0) return '';
  if (numbers.length === 1 || numbers.length <= minLength) return numbers.join(",  ");

  const ranges = [];
  let start = 0;

  for (let i = 1; i <= numbers.length; i++) {
    if (i === numbers.length || numbers[i] !== numbers[i - 1] + 1) {
      if (start === i - 1) {
        ranges.push(numbers[start].toString());
      } else {
        ranges.push(`${numbers[start]}-${numbers[i - 1]}`);
      }
      start = i;
    }
  }

  return ranges.join(',');
}
