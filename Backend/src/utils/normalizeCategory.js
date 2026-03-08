const slugify = (value) => {

  if (!value) return null;

  return value
    .toLowerCase()
    .trim()
    .replace(/[-\s]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
};

module.exports = slugify;