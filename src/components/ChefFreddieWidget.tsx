import React, { useState, useEffect } from 'react';
// @ts-ignore
import chefFreddiePng from '../images/logo.png';
import { useFreddieContext } from './FreddieContext';
import { askChefFreddie } from '../api/chefFreddie';

interface Message {
  sender: 'freddie' | 'user';
  text: string;
}

const getProactiveMessage = (page: string) => {
  switch (page) {
    case 'MyKitchen':
      return "Welcome to My Kitchen! Want tips on making the most of what you have in your pantry today?";
    case 'MyCookBook':
      return "Looking to organize your favorite recipes or find something new to try? I’m here to help!";
    case 'ChefsCorner':
      return "Ready to connect with fellow cooks or share your latest creation? Ask me anything!";
    case 'CulinarySchool':
      return "Curious about learning new skills or earning badges? I can guide you through our Culinary School!";
    default:
      return "Need a hand with anything on PorkChop? I’m always here to help you cook up something great!";
  }
};


const ChefFreddieWidget = () => {
  const [open, setOpen] = useState(false);
  const { context } = useFreddieContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastPage, setLastPage] = useState<string | undefined>();
  const [input, setInput] = useState('');

  const sendUserMessage = async (text: string) => {
    setMessages(msgs => [...msgs, { sender: 'user', text }]);
    setInput('');
    try {
      const reply = await askChefFreddie(text);
      setMessages(msgs => [...msgs, { sender: 'freddie', text: reply }]);
    } catch (err: any) {
      setMessages(msgs => [...msgs, { sender: 'freddie', text: err.message || 'Error contacting Chef Freddie.' }]);
    }
  };



  // Only show a proactive message if the user navigates to a new page while the chat is open
  useEffect(() => {
    if (!open) return;
    const proactive = getProactiveMessage(context.page);
    // Only update if page changed while chat is open (not on first open)
    if (lastPage && context.page !== lastPage) {
      setMessages(msgs => {
        // If last message was a Freddie proactive message, replace it
        if (
          msgs.length > 0 &&
          msgs[msgs.length - 1].sender === 'freddie' &&
          (msgs[msgs.length - 1].text.startsWith('You’re in') || msgs[msgs.length - 1].text.startsWith('Welcome to'))
        ) {
          return [...msgs.slice(0, -1), { sender: 'freddie', text: proactive }];
        }
        // Otherwise, append
        return [...msgs, { sender: 'freddie', text: proactive }];
      });
    }
    setLastPage(context.page);
    // eslint-disable-next-line
  }, [context.page, open]);

  // Contextual proactive prompt state
  const [showProactive, setShowProactive] = useState(false);
  const proactiveMessage = getProactiveMessage(context.page);

  // Show proactive when page changes and chat is closed
  useEffect(() => {
    if (!open && proactiveMessage) {
      setShowProactive(true);
    } else {
      setShowProactive(false);
    }
    // eslint-disable-next-line
  }, [context.page, open]);

  // Inject proactive message into chat when opened or page changes, but prevent duplicates
  useEffect(() => {
    if (open) {
      const proactive = getProactiveMessage(context.page);
      setMessages(msgs => {
        // Only add if the last message is NOT the same proactive message from Freddie
        if (
          proactive &&
          (msgs.length === 0 || msgs[msgs.length - 1].sender !== 'freddie' || msgs[msgs.length - 1].text !== proactive)
        ) {
          return [...msgs, { sender: 'freddie', text: proactive }];
        }
        return msgs;
      });
    }
    // eslint-disable-next-line
  }, [open, context.page]);

  return (
    <>
      <button
        className="fixed bottom-6 right-6 bg-maineBlue text-seafoam rounded-full w-16 h-16 flex items-center justify-center shadow-lg z-50 hover:bg-seafoam hover:text-maineBlue transition-colors"
        onClick={() => setOpen(o => !o)}
        aria-label="Open Chef Freddie AI Assistant"
      >
        <img
          src={chefFreddiePng}
          alt="Chef Freddie"
          className="w-12 h-12 rounded-full object-cover border-2 border-seafoam bg-white"
        />
      </button>

      {open && (
        <React.Fragment>
          <div className="fixed bottom-24 right-6 bg-white border border-maineBlue rounded shadow-lg p-4 w-80 z-50 flex flex-col max-h-[60vh]">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-maineBlue">Chef Freddie</span>
              <button onClick={() => {
                setOpen(false);
                setMessages([]);
              }} className="text-gray-500">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto mb-2">
              {messages.map((msg, i) => (
                <div key={i} className={`mb-2 ${msg.sender === 'freddie' ? 'text-maineBlue' : 'text-right text-gray-700'}`}>
                  <span className="block bg-sand rounded p-2 inline-block max-w-[90%]">{msg.text}</span>
                </div>
              ))}
            </div>
            <input
              className="w-full border rounded p-2"
              placeholder="Type your question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && input.trim()) {
                  sendUserMessage(input.trim());
                }
              }}
            />
          </div>
        </React.Fragment>
      )}
    </>
  );
};

export default ChefFreddieWidget;
