import { render, useEffect, useState } from "hono/jsx/dom";
import Canvas from "./canvas";

export default function UITest() {
  return (
    <>
      <Header />
      <Logo />
      <Canvas />

      <div id="mainbox">
        <FirstBox />

        <SecondBox />
      </div>
    </>
  );
}

function Header() {
  return <header id="header">落書きシティ</header>;
}

function ToolButton(props: { src: string; name: string; selected: boolean; onClick: () => void }) {
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
  const [color, setColor] = useState<string>("black");

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

  return (
    <div id="firstbox">
      <div id="toolbox">
        <ToolButton
          src="src/icons/pen.svg"
          name="ペン"
          selected={activeButton === 1}
          onClick={() => setActiveButton(1)}
        />

        <ColorSelect />
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
  return <img id="logo" src="public/sofume_logo.png" alt="落書きシティのロゴ" />;
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




