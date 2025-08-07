import { createContext, memo, useContext, useEffect, useState } from "hono/jsx";
import { render } from "hono/jsx/dom";
import Canvas from "./canvas";
import type { CanvasManager } from "./lib/canvas";
import type { ToolKind } from "./lib/canvas-tool";

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

function ToolButton(props: {
  src: string;
  name: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="basebtn" onClick={props.onClick}>
      <img
        src={props.src}
        alt={`${props.name}アイコン`}
        className={`svg-icon ${props.selected ? "btn-selected" : ""}`}
      />
      {props.name}
    </button>
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
    console.log(1);

    manager.setTool(name);
  }, [activeButton]);

  return (
    <div id="firstbox">
      <div id="toolbox">
        <ToolButton
          src="src/icons/pen.svg"
          name="ペン"
          selected={activeButton === 1}
          onClick={() => setActiveButton(1)}
        />

        <div id="colorbox">
          <button type="button" className="color-btn bg-black"></button>
          <button type="button" className="color-btn bg-red"></button>
          <button type="button" className="color-btn bg-yellow"></button>
          <button type="button" className="color-btn bg-blue"></button>
        </div>
      </div>

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
  return (
    <div id="secondbox">
      <button type="button" className="basebtn">
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
