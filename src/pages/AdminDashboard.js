import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useArtifacts } from '../context/ArtifactContext';
import ArtifactForm from '../components/admin/ArtifactForm';
import QRCodeDisplay from '../components/admin/QRCodeDisplay';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { artifacts, loading, addArtifact, updateArtifact, deleteArtifact, seedDefaultData } = useArtifacts();

  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [editingArtifact, setEditingArtifact] = useState(null);
  const [qrArtifact, setQrArtifact] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('vr360_admin_auth');
    navigate('/admin/login', { replace: true });
  };

  const handleAddClick = () => {
    setEditingArtifact(null);
    setModalMode('add');
  };

  const handleEditClick = (artifact) => {
    setEditingArtifact(artifact);
    setModalMode('edit');
  };

  const handleFormSave = async (formData) => {
    setFormLoading(true);
    try {
      if (modalMode === 'add') {
        await addArtifact({ ...formData });
        showToast(`✅ Đã thêm hiện vật "${formData.name}"`);
      } else if (modalMode === 'edit' && editingArtifact?.docId) {
        await updateArtifact(editingArtifact.docId, { ...formData });
        showToast(`💾 Đã cập nhật "${formData.name}"`);
      }
      setModalMode(null);
      setEditingArtifact(null);
    } catch (err) {
      console.error(err);
      showToast('❌ Có lỗi xảy ra: ' + err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?.docId) {
      showToast('❌ Hiện vật từ dữ liệu mặc định, không thể xóa. Hãy khởi tạo Firestore trước.', 'error');
      setDeleteTarget(null);
      return;
    }
    try {
      await deleteArtifact(deleteTarget.docId);
      showToast(`🗑️ Đã xóa "${deleteTarget.name}"`);
    } catch (err) {
      showToast('❌ Lỗi xóa: ' + err.message, 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedDefaultData();
      showToast('🌱 Đã khởi tạo dữ liệu mặc định lên Firestore!');
    } catch (err) {
      showToast('⚠️ ' + err.message, 'error');
    } finally {
      setSeeding(false);
    }
  };

  const filteredArtifacts = useMemo(() => {
    if (!search.trim()) return artifacts;
    const q = search.toLowerCase();
    return artifacts.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        (a.artifactId || a.id)?.toLowerCase().includes(q) ||
        a.material?.toLowerCase().includes(q)
    );
  }, [artifacts, search]);

  const stats = useMemo(() => ({
    total: artifacts.length,
    withVideo: artifacts.filter(a => a.videoUrl).length,
    withModel: artifacts.filter(a => a.modelUrl).length,
    withImage: artifacts.filter(a => a.imageUrl).length,
  }), [artifacts]);

  const isFirestoreData = artifacts.some(a => a.docId);

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🏛️</div>
          <div>
            <div className="sidebar-logo-title">VR360</div>
            <div className="sidebar-logo-sub">Admin Panel</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Quản lý</div>
          <a href="#artifacts" className="nav-item active">
            <span>📦</span> Hiện Vật
          </a>
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="nav-item nav-item-link" target="_blank" rel="noopener noreferrer">
            <span>🥽</span> Xem trang VR360
          </Link>
          <button className="nav-item nav-item-btn logout-btn" onClick={handleLogout}>
            <span>🚪</span> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <div className="header-left">
            <h1 className="header-title">Quản lý Hiện Vật</h1>
            <p className="header-sub">Thêm, sửa, xóa và tạo mã QR cho hiện vật bảo tàng</p>
          </div>
          <div className="header-right">
            <div className="admin-badge">
              <span>👤</span> admin
            </div>
          </div>
        </header>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>📦</div>
            <div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng hiện vật</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>🎬</div>
            <div>
              <div className="stat-value">{stats.withVideo}</div>
              <div className="stat-label">Có video</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>📐</div>
            <div>
              <div className="stat-value">{stats.withModel}</div>
              <div className="stat-label">Có model 3D</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(236,72,153,0.15)', color: '#f472b6' }}>🖼️</div>
            <div>
              <div className="stat-value">{stats.withImage}</div>
              <div className="stat-label">Có ảnh</div>
            </div>
          </div>
        </div>

        {/* Firestore notice */}
        {!isFirestoreData && !loading && (
          <div className="firestore-notice">
            <span>⚠️</span>
            <span>Firestore chưa có dữ liệu. Đang hiển thị dữ liệu mặc định.</span>
            <button className="seed-btn" onClick={handleSeed} disabled={seeding}>
              {seeding ? '⏳ Đang khởi tạo...' : '🌱 Khởi tạo lên Firestore'}
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="artifact-toolbar" id="artifacts">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Tìm theo tên hoặc mã ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
          <button className="btn-add" onClick={handleAddClick}>
            <span>＋</span> Thêm Hiện Vật
          </button>
        </div>

        {/* Artifact Grid */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Đang tải dữ liệu từ Firestore...</p>
          </div>
        ) : filteredArtifacts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🗿</div>
            <h3>Không tìm thấy hiện vật</h3>
            <p>{search ? `Không có kết quả cho "${search}"` : 'Chưa có hiện vật nào. Hãy thêm mới!'}</p>
          </div>
        ) : (
          <div className="artifact-grid">
            {filteredArtifacts.map((artifact) => (
              <ArtifactCard
                key={artifact.docId || artifact.id}
                artifact={artifact}
                onEdit={() => handleEditClick(artifact)}
                onDelete={() => setDeleteTarget(artifact)}
                onQR={() => setQrArtifact(artifact)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal: Add/Edit Form */}
      {modalMode && (
        <div className="modal-overlay" onClick={() => !formLoading && setModalMode(null)}>
          <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {modalMode === 'add' ? '➕ Thêm Hiện Vật Mới' : `✏️ Sửa: ${editingArtifact?.name}`}
              </h2>
              <button className="modal-close" onClick={() => !formLoading && setModalMode(null)}>✕</button>
            </div>
            <div className="modal-body">
              <ArtifactForm
                artifact={editingArtifact}
                onSave={handleFormSave}
                onCancel={() => setModalMode(null)}
                loading={formLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirm */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-card modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-icon">🗑️</div>
            <h3 className="delete-confirm-title">Xác nhận xóa</h3>
            <p className="delete-confirm-text">
              Bạn có chắc muốn xóa hiện vật <strong>"{deleteTarget.name}"</strong>?
              <br />
              Hành động này không thể hoàn tác.
            </p>
            <div className="delete-confirm-actions">
              <button className="btn-cancel-modal" onClick={() => setDeleteTarget(null)}>Hủy</button>
              <button className="btn-delete-confirm" onClick={handleDeleteConfirm}>Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrArtifact && (
        <QRCodeDisplay artifact={qrArtifact} onClose={() => setQrArtifact(null)} />
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

const ArtifactCard = ({ artifact, onEdit, onDelete, onQR }) => {
  const id = artifact.artifactId || artifact.id;
  const hasVideo = !!artifact.videoUrl;
  const hasModel = !!artifact.modelUrl;
  const hasImage = !!artifact.imageUrl;

  return (
    <div className="artifact-card-admin">
      {/* Image or placeholder */}
      <div className="card-img-wrap">
        {hasImage ? (
          <img src={artifact.imageUrl} alt={artifact.name} className="card-img" />
        ) : (
          <div className="card-img-placeholder">🏺</div>
        )}
        <div className="card-id-badge">{id}</div>
      </div>

      <div className="card-body-admin">
        <h3 className="card-name">{artifact.name}</h3>
        <div className="card-meta">
          {artifact.material && <span className="meta-chip material-chip">⚗️ {artifact.material}</span>}
          {artifact.period && <span className="meta-chip period-chip">📅 {artifact.period}</span>}
        </div>
        {artifact.description && (
          <p className="card-desc-preview">{artifact.description}</p>
        )}

        {/* Media badges */}
        <div className="media-badges">
          <span className={`media-badge ${hasVideo ? 'badge-active' : 'badge-inactive'}`}>🎬 Video</span>
          <span className={`media-badge ${hasModel ? 'badge-active' : 'badge-inactive'}`}>📐 3D</span>
          <span className={`media-badge ${hasImage ? 'badge-active' : 'badge-inactive'}`}>🖼️ Ảnh</span>
        </div>
      </div>

      {/* Actions */}
      <div className="card-actions-admin">
        <button className="card-btn btn-qr" onClick={onQR} title="Xem QR Code">
          <span>⬛</span> QR
        </button>
        <button className="card-btn btn-edit" onClick={onEdit} title="Chỉnh sửa">
          ✏️ Sửa
        </button>
        <button className="card-btn btn-delete" onClick={onDelete} title="Xóa">
          🗑️
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
