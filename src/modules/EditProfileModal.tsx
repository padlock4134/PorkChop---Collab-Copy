import React, { useState } from 'react';
import { supabase } from '../api/supabaseClient';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
  onProfileUpdated: (profile: any) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ open, onClose, user, onProfileUpdated }) => {
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase
      .from('profiles')
      .update({ username, bio, avatar_url: avatarUrl })
      .eq('id', user.id);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      onProfileUpdated({ ...user, username, bio, avatar_url: avatarUrl });
      onClose();
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <form onSubmit={handleSave} className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button type="button" onClick={onClose} className="absolute top-2 right-2 text-2xl text-gray-400 hover:text-maineBlue">×</button>
        <h2 className="text-xl font-bold mb-4 text-maineBlue">Edit Profile</h2>
        {error && <div className="mb-2 text-red-600">{error}</div>}
        <label className="block mb-2 font-semibold">Username</label>
        <input
          className="w-full mb-4 p-2 border rounded"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <label className="block mb-2 font-semibold">Bio</label>
        <textarea
          className="w-full mb-4 p-2 border rounded"
          value={bio}
          onChange={e => setBio(e.target.value)}
        />
        <label className="block mb-2 font-semibold">Avatar URL</label>
        <input
          className="w-full mb-4 p-2 border rounded"
          value={avatarUrl}
          onChange={e => setAvatarUrl(e.target.value)}
        />
        <button type="submit" disabled={loading} className="w-full bg-maineBlue text-seafoam py-2 rounded font-semibold hover:bg-seafoam hover:text-maineBlue transition-colors">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default EditProfileModal;
