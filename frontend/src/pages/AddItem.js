import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../utils/api";
import Button from "../components/ui/button";

const MAX_TAGS = 8;
const MAX_IMAGES = 5;

const fieldClass =
  "rounded-2xl border border-slate-700 bg-slate-950/75 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20";

const panelClass =
  "rounded-[28px] border border-slate-800 bg-slate-950/55 p-5";

const TextInput = ({ label, name, value, onChange, placeholder, error }) => (
  <label className="grid gap-2 text-sm font-semibold text-slate-300">
    {label}
    <input
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={fieldClass}
    />
    {error && <span className="text-xs text-rose-300">{error}</span>}
  </label>
);

const TextArea = ({ label, name, value, onChange, placeholder, error }) => {
  const charCount = useMemo(() => value.length, [value]);

  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-300">
      {label}
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={6}
        className={fieldClass}
      />
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{charCount} characters</span>
        {error && <span className="text-rose-300">{error}</span>}
      </div>
    </label>
  );
};

const TagInput = ({ tags, tagInput, setTagInput, setTags, error }) => {
  const normalizeTags = (value) =>
    value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, MAX_TAGS);

  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-300">
      Tags
      <input
        value={tagInput}
        onChange={(event) => {
          setTagInput(event.target.value);
          setTags(normalizeTags(event.target.value));
        }}
        onBlur={() => setTags(normalizeTags(tagInput))}
        placeholder="wallet, black, leather"
        className={fieldClass}
      />
      <div className="text-xs text-slate-500">
        {tags.length}/{MAX_TAGS} tags
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {error && <span className="text-xs text-rose-300">{error}</span>}
    </label>
  );
};

const ImageUploader = ({ images, setImages, primaryIndex, setPrimaryIndex }) => {
  const remainingImages = MAX_IMAGES - images.length;

  const handleFiles = (event) => {
    const files = Array.from(event.target.files || []).slice(0, MAX_IMAGES);
    setPrimaryIndex(0);
    setImages(files.map((file) => ({ file, url: URL.createObjectURL(file) })));
  };

  const removeImage = (index) => {
    setImages((previous) => previous.filter((_, imageIndex) => imageIndex !== index));
    setPrimaryIndex((previous) =>
      index === previous ? 0 : previous > index ? previous - 1 : previous
    );
  };

  useEffect(() => () => images.forEach((image) => URL.revokeObjectURL(image.url)), [images]);

  return (
    <label className="grid gap-3 text-sm font-semibold text-slate-300">
      Images
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFiles}
        className={fieldClass}
      />
      <span className="text-xs text-slate-500">
        {remainingImages} slots remaining
      </span>

      {images.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          {images.map((image, index) => (
            <div
              key={image.url}
              className="rounded-[24px] border border-slate-800 bg-slate-950/60 p-4"
            >
              <button
                type="button"
                onClick={() => setPrimaryIndex(index)}
                className="w-full overflow-hidden rounded-2xl"
              >
                <img
                  src={image.url}
                  alt={`Preview ${index + 1}`}
                  className="h-40 w-full object-cover"
                />
              </button>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                <span>{index === primaryIndex ? "Cover image" : "Set as cover"}</span>
                <button
                  type="button"
                  className="rounded-full border border-slate-700 px-3 py-1 font-semibold text-slate-300"
                  onClick={() => removeImage(index)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </label>
  );
};

const GeoLocationButton = ({ setForm, setStatus }) => (
  <button
    type="button"
    onClick={() => {
      if (!navigator.geolocation) {
        setStatus("Geolocation is not supported by your browser.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setForm((previous) => ({
            ...previous,
            locationLat: position.coords.latitude,
            locationLng: position.coords.longitude,
          }));
          setStatus("Location updated.");
        },
        () => setStatus("Location permission denied.")
      );
    }}
    className="mt-1 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-xs font-semibold text-slate-200"
  >
    Use current location
  </button>
);

function AddItem() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    type: "lost",
    locationLat: "",
    locationLng: "",
  });
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [images, setImages] = useState([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (position) =>
        setForm((previous) => ({
          ...previous,
          locationLat: position.coords.latitude,
          locationLng: position.coords.longitude,
        })),
      () => {}
    );
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.title.trim()) nextErrors.title = "Title is required.";
    if (!form.location.trim()) nextErrors.location = "Location is required.";
    if (!form.category.trim()) nextErrors.category = "Category is required.";
    if (!form.description.trim()) nextErrors.description = "Description is required.";
    if (!form.locationLat || !form.locationLng) {
      nextErrors.location = "Enable location access.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = (preserveStatus = false) => {
    setForm({
      title: "",
      description: "",
      category: "",
      location: "",
      type: "lost",
      locationLat: "",
      locationLng: "",
    });
    setTags([]);
    setTagInput("");
    setImages([]);
    setPrimaryIndex(0);
    if (!preserveStatus) setStatus("");
    setErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || !validate()) return;

    setSubmitting(true);
    setStatus("Submitting report...");

    try {
      const data = new FormData();
      const tagLine = tags.length ? `Tags: ${tags.join(", ")}` : "";
      const finalDescription = tagLine
        ? `${form.description}\n\n${tagLine}`
        : form.description;

      const payload = { ...form, description: finalDescription };
      Object.entries(payload).forEach(([key, value]) => data.append(key, value));

      if (images.length) {
        const orderedImages = images.map((image) => image.file);
        const coverImage = orderedImages.splice(primaryIndex, 1);
        coverImage
          .concat(orderedImages)
          .forEach((file) => data.append("images", file));
      }

      const created = await apiRequest("/api/items", {
        method: "POST",
        auth: true,
        body: data,
        isForm: true,
      });

      setStatus(
        created.status === "matched"
          ? "A potential match was found and sent for review."
          : "Item reported successfully."
      );
      resetForm(true);
    } catch (error) {
      setStatus(error.message || "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <section className="glass-panel rounded-[32px] p-8 md:p-10">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[30px] border border-cyan-400/15 bg-gradient-to-br from-cyan-400/10 via-slate-950/70 to-slate-950/90 p-7">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Report workspace
            </div>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
              Report a lost or found item with a cleaner, guided flow.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Add a strong title, precise location, detailed description, and
              supporting images to improve match quality and review speed.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
                Up to {MAX_IMAGES} images
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
                Up to {MAX_TAGS} tags
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
                Location aware
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className={panelClass}>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Best title
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Use a short label with color, item type, or standout detail.
              </p>
            </div>
            <div className={panelClass}>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Best description
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Mention identifying marks, brand, time, and where it was seen.
              </p>
            </div>
            <div className={panelClass}>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Best images
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Keep the clearest photo as the cover image for faster review.
              </p>
            </div>
          </div>
        </div>

        <form className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]" onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <div className={panelClass}>
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-100">
                  Basic details
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Start with the core information someone needs to identify the item.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <TextInput
                  label="Title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Black wallet with ID"
                  error={errors.title}
                />
                <TextInput
                  label="Category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Wallet, phone, documents"
                  error={errors.category}
                />
                <TextInput
                  label="Location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Library, gate 2, cafeteria"
                  error={errors.location}
                />

                <label className="grid gap-2 text-sm font-semibold text-slate-300">
                  Type
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className={fieldClass}
                  >
                    <option value="lost">Lost</option>
                    <option value="found">Found</option>
                  </select>
                </label>

                <div className="lg:col-span-2">
                  <div className="text-sm font-semibold text-slate-300">
                    Live location
                  </div>
                  <GeoLocationButton setForm={setForm} setStatus={setStatus} />
                  {form.locationLat && form.locationLng && (
                    <div className="mt-2 text-xs text-slate-500">
                      Lat: {Number(form.locationLat).toFixed(4)} - Lng:{" "}
                      {Number(form.locationLng).toFixed(4)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={panelClass}>
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-100">
                  Description and tags
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Add context that improves automatic matching and manual review.
                </p>
              </div>
              <div className="grid gap-5">
                <TextArea
                  label="Description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Include color, brand, identifying marks, time, and anything unique..."
                  error={errors.description}
                />
                <TagInput
                  tags={tags}
                  tagInput={tagInput}
                  setTagInput={setTagInput}
                  setTags={setTags}
                  error={errors.tags}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className={panelClass}>
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-100">
                  Image gallery
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Upload clear photos and pick the strongest cover image.
                </p>
              </div>
              <ImageUploader
                images={images}
                setImages={setImages}
                primaryIndex={primaryIndex}
                setPrimaryIndex={setPrimaryIndex}
              />
            </div>

            <div className={panelClass}>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-slate-100">
                  Submit
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Review your details before sending the report.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit report"}
                </Button>
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Clear form
                </Button>
              </div>

              {status && (
                <div
                  className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                    status.includes("successfully") ||
                    status.includes("match") ||
                    status.includes("updated")
                      ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
                      : "border-rose-400/20 bg-rose-400/10 text-rose-200"
                  }`}
                >
                  {status}
                </div>
              )}
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

export default AddItem;
