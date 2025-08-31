import {
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "hono/jsx";
import { SessionContext } from "./context";

/**
 * PCの画面の左、スマホでの下に表示される、ボタン群を格納するボックス。
 * ペンや消しゴムの切り替えなどのUIを提供する。
 */
export function ToolBox() {
  const [activeButton, setActiveButton] = useState<number>(1);
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
        src="/icons/pen.svg"
        name="ペン"
        selected={activeButton === 1}
        onClick={() => setActiveButton(1)}
        className="pen-btn"
      >
        <ColorSelect />
      </ToolButton>

      <ToolButton
        src="/icons/eraser.svg"
        name="消しゴム"
        selected={activeButton === 2}
        onClick={() => setActiveButton(2)}
      />

      <ToolButton
        src="/icons/lasso.svg"
        name="投げ縄"
        selected={activeButton === 3}
        onClick={() => setActiveButton(3)}
      />
    </div>
  );
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

/**
 * 色選択ボタン
 */
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

/**
 * 色選択。色選択ボタンを提供し、色を切り替えられるようにする。
 */
function ColorSelect() {
  const [color, setColor] = useState<string>("blue");
  const session = useContext(SessionContext);

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
