import { createContext, memo, useContext, useEffect, useState, type PropsWithChildren } from "hono/jsx";
import { render } from "hono/jsx/dom";
import Canvas from "./canvas";
import type { CanvasManager } from "./lib/canvas";
import type { ColorKind, ToolKind } from "./lib/canvas-tool";

const CanvasWithMemo = memo(Canvas);

export default function UITest() {
  const [manager, setManager] = useState<CanvasManager | null>(null);

  return (
    <>
      <Header />
      <Logo />
      <CanvasWithMemo setCanvasManager={setManager} />

      <canvasContext.Provider value={manager}>
        <div id="mainbox">
          <FirstBox />

          <SecondBox />
        </div>
      </canvasContext.Provider>
    </>
  );
}

const canvasContext = createContext<CanvasManager | null>(null);

function Header() {
  return <header id="header">落書きシティ</header>;
}

function ToolButton(props: PropsWithChildren<{
  src: string;
  name: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
}>) {
  return (
    <button type="button" className={`basebtn ${props.className || ""}`} onClick={props.onClick}>
      <img
        src={props.src}
        alt={`${props.name}アイコン`}
        className={`svg-icon ${props.selected ? "btn-selected" : ""}`}
      />
      {props.name}

      {props.children}
    </button>
  );
}


function ColorButton(props: {  name: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" className="basebtn" onClick={props.onClick}>
      <button
        type="button"
        className={`color-btn bg-${props.name} ${props.selected ? "color-btn-selected" : ""}`}
      />
    </button>
  );
}


//次回 色のボタンにアウトライン 切り替え
function ColorSelect() {
  const [color, setColor] = useState<string>("blue");
  const manager = useContext(canvasContext);
  // useEffect使えば、colorの値が変更されるたびに、なんらかの処理ができる。
  // → ってことは、ここで、colorが変わるたびに、CanvasManagerのpenのcolorを変更する処理をすればいい。
  //
  // 1. managerをFirstBoxにあるuseContext(canvasContext)で取得。
  // 2. manager.getTools() → penとeraserを取得。
  // 3. useEffectを使って、colorが変更されるたびに、penとeraserのpenからcolorを変更。コード例: pen.color = "red"
  useEffect(() => {
    if (!manager) return;

    manager.getTools().pen.color = color;
  }, [color]);

  return (
    <div id="colorbox">
      <ColorButton name="black" selected={color === "black"} onClick={() => setColor("black")} />
      <ColorButton name="red" selected={color === "red"} onClick={() => setColor("red")} />
      <ColorButton name="yellow" selected={color === "yellow"} onClick={() => setColor("yellow")} />
      <ColorButton name="blue" selected={color === "blue"} onClick={() => setColor("blue")} />
    </div>
  );
}

function FirstBox() {
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const manager = useContext(canvasContext);

  useEffect(() => {
    if (!manager) return;

    let name: ToolKind = "pen";

    switch (activeButton) {
      case 1:
        name = "pen";
        break;
      case 2:
        name = "eraser";
        break;
    }

    manager.setTool(name);
  }, [activeButton]);

  return (
    <div id="firstbox">
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

function SecondBox() {
  const manager = useContext(canvasContext);
  const onClickReset = () => {
    if (!manager) return;
    manager.clear();
  };
  return (
    <div id="secondbox">
      <button type="button" className="basebtn" onClick={onClickReset}>
        <img
          src="src/icons/trash-2.svg"
          alt="リセットアイコン"
          className="svg-icon"
        />
        リセット
      </button>
      <button type="button" className="basebtn">
        <img
          src="src/icons/undo-2.svg"
          alt="元に戻すアイコン"
          className="svg-icon"
        />
        元に戻す
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
