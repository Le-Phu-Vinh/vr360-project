import React, { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import './ArtifactForm.css';

const INITIAL_FORM = {
  artifactId: '',
  name: '',
  origin: '',
  period: '',
  material: '',
  description: '',
  modelUrl: '',
  textureUrl: '',
  videoUrl: '',
  videoTitle: '',
  imageUrl: '',
};

const UploadField = ({ label, fieldKey, accept, icon, formData, setFormData, uploading, setUploading, progress, setProgress, artifactId }) => {
  const inputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!artifactId.trim()) {
      alert('Vui lòng nhập Mã QR (ID) trước khi upload file.');
      return;
    }

    const ext = file.name.split('.').pop();
    const path = `artifacts/${artifactId.trim()}/${fieldKey}/${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploading((prev) => ({ ...prev, [fieldKey]: true }));
    setProgress((prev) => ({ ...prev, [fieldKey]: 0 }));

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgress((prev) => ({ ...prev, [fieldKey]: pct }));
      },
      (err) => {
        console.error('Upload lỗi:', err);
        alert('Upload thất bại: ' + err.message);
        setUploading((prev) => ({ ...prev, [fieldKey]: false }));
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setFormData((prev) => ({ ...prev, [fieldKey]: url }));
        setUploading((prev) => ({ ...prev, [fieldKey]: false }));
      }
    );
  };

  const isUploading = uploading[fieldKey];
  const currentProgress = progress[fieldKey] || 0;
  const currentUrl = formData[fieldKey];

  return (
    <div className="upload-field">
      <label className="field-label">{label}</label>
      <div className="upload-row">
        <input
          type="text"
          className="field-input url-input"
          value={currentUrl}
          onChange={(e) => setFormData((prev) => ({ ...prev, [fieldKey]: e.target.value }))}
          placeholder="URL file hoặc upload từ máy tính..."
        />
        <button
          type="button"
          className="upload-btn"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          title="Upload file"
        >
          {isUploading ? `${currentProgress}%` : icon}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      {isUploading && (
        <div className="progress-bar-wrap">
          <div className="progress-bar" style={{ width: `${currentProgress}%` }} />
          <span className="progress-label">Đang tải lên... {currentProgress}%</span>
        </div>
      )}
      {!isUploading && currentUrl && (
        <div className="url-preview">
          {(fieldKey === 'imageUrl' || fieldKey === 'textureUrl') && currentUrl.startsWith('http') ? (
            <img src={currentUrl} alt="preview" className="img-preview" />
          ) : (
            <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="file-link">
              🔗 Xem file
            </a>
          )}
        </div>
      )}
    </div>
  );
};

const ArtifactForm = ({ artifact, onSave, onCancel, loading }) => {
  const isEdit = !!artifact?.docId;

  const [formData, setFormData] = useState(
    artifact
      ? {
          artifactId: artifact.artifactId || artifact.id || '',
          name: artifact.name || '',
          origin: artifact.origin || '',
          period: artifact.period || '',
          material: artifact.material || '',
          description: artifact.description || '',
          modelUrl: artifact.modelUrl || '',
          textureUrl: artifact.textureUrl || '',
          videoUrl: artifact.videoUrl || '',
          videoTitle: artifact.videoTitle || '',
          imageUrl: artifact.imageUrl || '',
        }
      : { ...INITIAL_FORM }
  );

  const [uploading, setUploading] = useState({
    imageUrl: false,
    modelUrl: false,
    textureUrl: false,
    videoUrl: false,
  });
  const [progress, setProgress] = useState({
    imageUrl: 0,
    modelUrl: 0,
    textureUrl: 0,
    videoUrl: 0,
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.artifactId.trim()) errs.artifactId = 'Mã QR không được để trống';
    if (!formData.name.trim()) errs.name = 'Tên hiện vật không được để trống';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSave(formData);
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const isAnyUploading = Object.values(uploading).some(Boolean);

  return (
    <form className="artifact-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        {/* LEFT: Thông tin cơ bản */}
        <div className="form-col">
          <h3 className="form-section-title">📋 Thông tin cơ bản</h3>

          <div className="form-group">
            <label className="field-label">
              Mã QR (ID) <span className="required">*</span>
            </label>
            <input
              type="text"
              className={`field-input ${errors.artifactId ? 'error' : ''}`}
              value={formData.artifactId}
              onChange={(e) => handleChange('artifactId', e.target.value.toUpperCase())}
              placeholder="CV001"
              disabled={isEdit}
            />
            {errors.artifactId && <span className="field-error">{errors.artifactId}</span>}
            {isEdit && <span className="field-hint">Mã QR không thể thay đổi sau khi tạo</span>}
          </div>

          <div className="form-group">
            <label className="field-label">
              Tên hiện vật <span className="required">*</span>
            </label>
            <input
              type="text"
              className={`field-input ${errors.name ? 'error' : ''}`}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Trống Đồng Đông Sơn"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="field-label">Nguồn gốc</label>
            <input
              type="text"
              className="field-input"
              value={formData.origin}
              onChange={(e) => handleChange('origin', e.target.value)}
              placeholder="Lưu vực sông Hồng, Việt Nam"
            />
          </div>

          <div className="form-group">
            <label className="field-label">Niên đại</label>
            <input
              type="text"
              className="field-input"
              value={formData.period}
              onChange={(e) => handleChange('period', e.target.value)}
              placeholder="Khoảng 700 TCN - 100 SCN"
            />
          </div>

          <div className="form-group">
            <label className="field-label">Vật liệu</label>
            <input
              type="text"
              className="field-input"
              value={formData.material}
              onChange={(e) => handleChange('material', e.target.value)}
              placeholder="Đồng thau"
            />
          </div>

          <div className="form-group">
            <label className="field-label">Mô tả</label>
            <textarea
              className="field-input field-textarea"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Mô tả chi tiết về hiện vật..."
              rows={4}
            />
          </div>
        </div>

        {/* RIGHT: Media */}
        <div className="form-col">
          <h3 className="form-section-title">🎬 Media</h3>

          <UploadField
            label="Ảnh đại diện"
            fieldKey="imageUrl"
            accept="image/*"
            icon="🖼"
            formData={formData}
            setFormData={setFormData}
            uploading={uploading}
            setUploading={setUploading}
            progress={progress}
            setProgress={setProgress}
            artifactId={formData.artifactId}
          />

          <UploadField
            label="Model 3D (.ply)"
            fieldKey="modelUrl"
            accept=".ply"
            icon="📦"
            formData={formData}
            setFormData={setFormData}
            uploading={uploading}
            setUploading={setUploading}
            progress={progress}
            setProgress={setProgress}
            artifactId={formData.artifactId}
          />

          <UploadField
            label="Texture Model"
            fieldKey="textureUrl"
            accept="image/*"
            icon="🎨"
            formData={formData}
            setFormData={setFormData}
            uploading={uploading}
            setUploading={setUploading}
            progress={progress}
            setProgress={setProgress}
            artifactId={formData.artifactId}
          />

          <UploadField
            label="Video thuyết minh"
            fieldKey="videoUrl"
            accept="video/*"
            icon="🎬"
            formData={formData}
            setFormData={setFormData}
            uploading={uploading}
            setUploading={setUploading}
            progress={progress}
            setProgress={setProgress}
            artifactId={formData.artifactId}
          />

          <div className="form-group">
            <label className="field-label">Tiêu đề video</label>
            <input
              type="text"
              className="field-input"
              value={formData.videoTitle}
              onChange={(e) => handleChange('videoTitle', e.target.value)}
              placeholder="Video Thuyết minh: ..."
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel} disabled={loading || isAnyUploading}>
          Hủy
        </button>
        <button type="submit" className="btn-save" disabled={loading || isAnyUploading}>
          {loading ? (
            <span className="btn-spinner" />
          ) : isAnyUploading ? (
            '⏳ Đang upload...'
          ) : isEdit ? (
            '💾 Lưu thay đổi'
          ) : (
            '✅ Thêm hiện vật'
          )}
        </button>
      </div>
    </form>
  );
};

export default ArtifactForm;
