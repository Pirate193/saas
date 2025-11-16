import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { CommandItem } from "./slash-command";


interface SlashCommandMenuProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

const SlashCommandMenu = forwardRef((props: SlashCommandMenuProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];

    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }

      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }

      if (event.key === "Enter") {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 max-h-80 overflow-y-auto min-w-[280px]">
      <div className="text-xs text-gray-500 px-2 py-1 mb-1 font-medium">BASIC BLOCKS</div>
      {props.items.length ? (
        props.items.map((item: CommandItem, index: number) => (
          <button
            className={`flex items-start gap-3 w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors ${
              index === selectedIndex ? "bg-gray-100" : ""
            }`}
            key={index}
            onClick={() => selectItem(index)}
          >
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-50 rounded text-sm font-medium text-gray-700">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">{item.title}</div>
              {item.description && (
                <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
              )}
            </div>
          </button>
        ))
      ) : (
        <div className="text-sm text-gray-500 px-3 py-2">No results</div>
      )}
    </div>
  );
});

SlashCommandMenu.displayName = "SlashCommandMenu";

export default SlashCommandMenu;