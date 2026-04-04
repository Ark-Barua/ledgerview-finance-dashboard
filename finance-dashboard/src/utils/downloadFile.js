export function downloadTextFile(filename, content, mimeType = "text/plain;charset=utf-8;") {
  const fileBlob = new Blob([content], { type: mimeType });
  const downloadUrl = window.URL.createObjectURL(fileBlob);
  const downloadLink = document.createElement("a");

  downloadLink.href = downloadUrl;
  downloadLink.download = filename;
  downloadLink.click();

  window.URL.revokeObjectURL(downloadUrl);
}
