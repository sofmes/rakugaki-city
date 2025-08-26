import {
  createContext,
  memo,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "hono/jsx";
import { render } from "hono/jsx/dom";
import Canvas from "./components/canvas";
import { CanvasObjectModel } from "./lib/client/canvas";
import { Session } from "./lib/client/session";

const CanvasWithMemo = memo(Canvas);
const DEFAULT_COLOR = "blue" as const;

export default function UITest() {
  const [session, setSession] = useState<Session | null>(null);

  const createCanvasController = useMemo(
    () => (e: HTMLCanvasElement) => {
      const ctx = e.getContext("2d");
      if (!ctx) {
        alert("キャンバスの準備に失敗しました。");
        throw new Error("キャンバスのコンテクストの取得に失敗。");
      }

      // バックエンドに接続する。
      const ws = new WebSocket(`${location.pathname}/ws`);
      const userId = crypto.randomUUID();

      const com = new CanvasObjectModel(userId, ctx, DEFAULT_COLOR);
      const session = new Session(com, userId, ws);

      setSession(session);
      return session;
    },
    [],
  );

  return (
    <>
      <Header />
      <Logo />

      <CanvasWithMemo
        createCanvasSession={createCanvasController}
        defaultColor={DEFAULT_COLOR}
      />

      <SessionContext.Provider value={session}>
        <div id="mainbox">
          <ToolBox />

          <UtilityBox />
        </div>
      </SessionContext.Provider>
    </>
  );
}

const SessionContext = createContext<Session | null>(null);

function Header() {
  return <header id="header">落書きシティ</header>;
}

function ToolButton(
  props: PropsWithChildren<{
    src: string;
    name: string;
    selected: boolean;
    onClick: () => void;
    className?: string;
  }>,
) {
  return (
    <button
      type="button"
      className={`basebtn ${props.className || ""}`}
      onClick={props.onClick}
    >
      <img
        src={props.src}
        alt={`${props.name}アイコン`}
        className={`svg-icon ${props.selected ? "btn-selected" : ""}`}
      />
      <div style="margin-inline: auto;">{props.name}</div>

      {props.children}
    </button>
  );
}

function ColorButton(props: {
  name: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`color-btn bg-${props.name} ${props.selected ? "color-btn-selected" : ""}`}
      onClick={props.onClick}
    />
  );
}

//次回 色のボタンにアウトライン 切り替え
function ColorSelect() {
  const [color, setColor] = useState<string>("blue");
  const session = useContext(SessionContext);
  // useEffect使えば、colorの値が変更されるたびに、なんらかの処理ができる。
  // → ってことは、ここで、colorが変わるたびに、CanvasManagerのpenのcolorを変更する処理をすればいい。
  //
  // 1. managerをtoolboxにあるuseContext(canvasContext)で取得。
  // 2. com.getTools() → penとeraserを取得。
  // 3. useEffectを使って、colorが変更されるたびに、penとeraserのpenからcolorを変更。コード例: pen.color = "red"
  useEffect(() => {
    if (!session) return;

    session.setColor(color);
  }, [color]);

  return (
    <div id="colorbox">
      <ColorButton
        name="black"
        selected={color === "black"}
        onClick={() => setColor("black")}
      />
      <ColorButton
        name="red"
        selected={color === "red"}
        onClick={() => setColor("red")}
      />
      <ColorButton
        name="yellow"
        selected={color === "yellow"}
        onClick={() => setColor("yellow")}
      />
      <ColorButton
        name="blue"
        selected={color === "blue"}
        onClick={() => setColor("blue")}
      />
    </div>
  );
}

function ToolBox() {
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const session = useContext(SessionContext);

  useEffect(() => {
    if (!session) return;

    switch (activeButton) {
      case 1:
        session.setEraserMode(false);
        break;
      case 2:
        // 消しゴム
        session.setEraserMode(true);
        break;
    }
  }, [activeButton]);

  return (
    <div id="toolbox">
      <ToolButton
        src="src/icons/pen.svg"
        name="ペン"
        selected={activeButton === 1}
        onClick={() => setActiveButton(1)}
        className="pen-btn"
      >
        <ColorSelect />
      </ToolButton>

      <ToolButton
        src="src/icons/eraser.svg"
        name="消しゴム"
        selected={activeButton === 2}
        onClick={() => setActiveButton(2)}
      />

      <ToolButton
        src="src/icons/lasso.svg"
        name="投げ縄"
        selected={activeButton === 3}
        onClick={() => setActiveButton(3)}
      />
    </div>
  );
}

function UtilityBox() {
  const session = useContext(SessionContext);

  const reset = () => {
    if (!session) return;

    session.reset();
  };

  const undo = () => {
    if (!session) return;

    session.undo();
  };

  return (
    <div id="utilitybox">
      <button type="button" className="basebtn" onClick={reset}>
        <img
          src="src/icons/trash-2.svg"
          alt="リセットアイコン"
          className="svg-icon"
        />
        <div style="margin-inline: auto;">リセット</div>
      </button>
      <button type="button" className="basebtn" onClick={undo} id="undo-button">
        <img
          src="src/icons/undo-2.svg"
          alt="元に戻すアイコン"
          className="svg-icon"
          id="undo-icon"
        />
        <div style="margin-inline: auto;">元に戻す</div>
      </button>
    </div>
  );
}

function Logo() {
  return (
    <img id="logo" src="public/sofume_logo.png" alt="落書きシティのロゴ" />
  );
}

const element = document.getElementById("client-components");
render(<UITest />, element as HTMLElement);

// function COUNTER() {
//   const [count, Setcount] = useState(0)

//   return (
//     <button onClick={() => Setcount(count + 1)}>カウント: {count}</button>
//   );
// }

//　ボタンの選択の時にボーダーを設定 Reactで 次回まで
