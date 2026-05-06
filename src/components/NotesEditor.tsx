import { useEffect, useRef, useState } from 'react';
import type { Player } from '../types';
import { useStore } from '../store';

const TAG_PATTERN = /<(img|br|div|p|span|strong|em)[\s/>]/i;

function applyContent(el: HTMLElement, notes: string) {
  if (notes && TAG_PATTERN.test(notes)) {
    el.innerHTML = notes;
  } else {
    el.textContent = notes ?? '';
  }
}

function isEditorEmpty(el: HTMLElement): boolean {
  if (el.querySelector('img')) return false;
  return (el.textContent ?? '').trim().length === 0;
}

export function NotesEditor({ player }: { player: Player }) {
  const setNotes = useStore((s) => s.setNotes);
  const ref = useRef<HTMLDivElement>(null);
  const lastPlayerId = useRef(player.id);
  const lastSavedHtml = useRef(player.notes);
  const timer = useRef<number | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const switching = lastPlayerId.current !== player.id;
    if (switching) {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
      applyContent(el, player.notes);
      lastPlayerId.current = player.id;
      lastSavedHtml.current = player.notes;
      setSavedAt(null);
      setEmpty(isEditorEmpty(el));
    } else if (timer.current === null && player.notes !== el.innerHTML) {
      applyContent(el, player.notes);
      lastSavedHtml.current = player.notes;
      setEmpty(isEditorEmpty(el));
    }
  }, [player.id, player.notes]);

  const scheduleSave = () => {
    const el = ref.current;
    if (!el) return;
    setEmpty(isEditorEmpty(el));
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      timer.current = null;
      const html = ref.current?.innerHTML ?? '';
      if (html === lastSavedHtml.current) return;
      try {
        await setNotes(player.id, html);
        lastSavedHtml.current = html;
        setSavedAt(Date.now());
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      }
    }, 500);
  };

  const flush = async () => {
    if (timer.current === null) return;
    window.clearTimeout(timer.current);
    timer.current = null;
    const html = ref.current?.innerHTML ?? '';
    if (html === lastSavedHtml.current) return;
    try {
      await setNotes(player.id, html);
      lastSavedHtml.current = html;
      setSavedAt(Date.now());
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const onPaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');

    try {
      const url = await window.lono.screenshots.pasteFromClipboard();
      if (url) {
        document.execCommand(
          'insertHTML',
          false,
          `<img src="${url}" alt="screenshot" />`,
        );
        scheduleSave();
        return;
      }
    } catch (err) {
      console.error('paste image failed', err);
    }

    if (text) {
      document.execCommand('insertText', false, text);
      scheduleSave();
    }
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        spellCheck
        onInput={scheduleSave}
        onBlur={flush}
        onPaste={onPaste}
        className="notes-editor min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words bg-bg p-6 text-sm text-text caret-accent focus:outline-none"
      />
      {empty && (
        <div className="pointer-events-none absolute left-6 top-6 text-sm text-text-mute select-none">
          Freeform thinking. Autosaves.
        </div>
      )}
      <div className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-text-mute">
        {savedAt
          ? `Saved ${new Date(savedAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : ''}
      </div>
    </div>
  );
}
