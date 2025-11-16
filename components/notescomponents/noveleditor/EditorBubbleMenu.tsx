import { Editor } from "@tiptap/react";
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code,
  Link as LinkIcon,
  ChevronDown,
  MoreVertical
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface EditorBubbleMenuProps {
  editor: Editor;
}

interface TurnIntoMenuProps {
  editor: Editor;
  onClose: () => void;
}

const TurnIntoMenu = ({ editor, onClose }: TurnIntoMenuProps) => {
  const menuItems = [
    {
      label: "Text",
      icon: "T",
      command: () => {
        editor.chain().focus().setParagraph().run();
        onClose();
      },
      active: editor.isActive("paragraph"),
    },
    {
      label: "Heading 1",
      icon: "H1",
      command: () => {
        editor.chain().focus().setHeading({ level: 1 }).run();
        onClose();
      },
      active: editor.isActive("heading", { level: 1 }),
    },
    {
      label: "Heading 2",
      icon: "H2",
      command: () => {
        editor.chain().focus().setHeading({ level: 2 }).run();
        onClose();
      },
      active: editor.isActive("heading", { level: 2 }),
    },
    {
      label: "Heading 3",
      icon: "H3",
      command: () => {
        editor.chain().focus().setHeading({ level: 3 }).run();
        onClose();
      },
      active: editor.isActive("heading", { level: 3 }),
    },
    {
      label: "Bulleted list",
      icon: "•",
      command: () => {
        editor.chain().focus().toggleBulletList().run();
        onClose();
      },
      active: editor.isActive("bulletList"),
    },
    {
      label: "Numbered list",
      icon: "1.",
      command: () => {
        editor.chain().focus().toggleOrderedList().run();
        onClose();
      },
      active: editor.isActive("orderedList"),
    },
    {
      label: "To-do list",
      icon: "☐",
      command: () => {
        editor.chain().focus().toggleTaskList().run();
        onClose();
      },
      active: editor.isActive("taskList"),
    },
  ];

  return (
    <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1 min-w-[200px] z-50">
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={item.command}
          className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors ${
            item.active ? "bg-blue-50" : ""
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center text-xs font-medium text-gray-700">
            {item.icon}
          </div>
          <span className="text-sm text-gray-900">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

const EditorBubbleMenu = ({ editor }: EditorBubbleMenuProps) => {
  const [showTurnInto, setShowTurnInto] = useState(false);
  const turnIntoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (turnIntoRef.current && !turnIntoRef.current.contains(event.target as Node)) {
        setShowTurnInto(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1">
      {/* Turn Into Dropdown */}
      <div className="relative" ref={turnIntoRef}>
        <button
          onClick={() => setShowTurnInto(!showTurnInto)}
          className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-100 rounded text-sm font-medium transition-colors text-gray-700"
        >
          Text
          <ChevronDown className="w-3 h-3" />
        </button>
        {showTurnInto && (
          <TurnIntoMenu editor={editor} onClose={() => setShowTurnInto(false)} />
        )}
      </div>

      <div className="w-px h-6 bg-gray-200" />

      {/* Bold */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 hover:bg-gray-100 rounded transition-colors ${
          editor.isActive("bold") ? "bg-gray-100" : ""
        }`}
        title="Bold"
      >
        <Bold className="w-4 h-4 text-gray-700" />
      </button>

      {/* Italic */}
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 hover:bg-gray-100 rounded transition-colors ${
          editor.isActive("italic") ? "bg-gray-100" : ""
        }`}
        title="Italic"
      >
        <Italic className="w-4 h-4 text-gray-700" />
      </button>

      {/* Underline */}
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 hover:bg-gray-100 rounded transition-colors ${
          editor.isActive("underline") ? "bg-gray-100" : ""
        }`}
        title="Underline"
      >
        <Underline className="w-4 h-4 text-gray-700" />
      </button>

      {/* Strikethrough */}
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 hover:bg-gray-100 rounded transition-colors ${
          editor.isActive("strike") ? "bg-gray-100" : ""
        }`}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4 text-gray-700" />
      </button>

      {/* Code */}
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-1.5 hover:bg-gray-100 rounded transition-colors ${
          editor.isActive("code") ? "bg-gray-100" : ""
        }`}
        title="Code"
      >
        <Code className="w-4 h-4 text-gray-700" />
      </button>

      <div className="w-px h-6 bg-gray-200" />

      {/* Link */}
      <button
        onClick={() => {
          const url = window.prompt("Enter URL");
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={`p-1.5 hover:bg-gray-100 rounded transition-colors ${
          editor.isActive("link") ? "bg-gray-100" : ""
        }`}
        title="Link"
      >
        <LinkIcon className="w-4 h-4 text-gray-700" />
      </button>

      <div className="w-px h-6 bg-gray-200" />

      {/* More Options */}
      <button
        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
        title="More"
      >
        <MoreVertical className="w-4 h-4 text-gray-700" />
      </button>
    </div>
  );
};

export default EditorBubbleMenu;