import React from 'react';

const Post = ({ user, content, image, timestamp, likes, comments }) => (
  <div className="chefs-corner-post bg-sand p-4 rounded shadow-inner">
    <div className="flex items-center mb-2">
      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full mr-3 border-2 border-maineBlue" />
      <div>
        <span className="font-bold text-maineBlue">{user.name}</span>
        <span className="ml-2 text-xs text-gray-500">{timestamp}</span>
      </div>
    </div>
    <div className="mb-2 text-lg">{content}</div>
    {image && <img src={image} alt="Post attachment" className="w-full rounded mb-2" />}
    <div className="flex gap-4 text-sm text-gray-600">
      <button className="hover:text-maineBlue">👍 {likes}</button>
      <button className="hover:text-maineBlue">💬 {comments}</button>
    </div>
  </div>
);

export default Post;
