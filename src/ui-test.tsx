export default function UITest() {
	return <>
    <Header />

    <div id="mainbox">
      <FirstBox />

      <div id="thirdbox">
      </div>

      <SecondBox />
    </div>
  </>;
}

function Header() {
  return <header id="header">
    落書きシティ
  </header>
}

function ToolButton(props: {src: string, name: string, selected: boolean}) { 
  return <button type="button" className="basebtn">
    <img
      src={props.src}
      alt={`${props.name}アイコン`}
      className={`svg-icon ${props.selected ? "btn-selected" : ""}`}
    />
    {props.name}
  </button>
}

// - ロゴの配置
// - 上のToolButtonを少し勉強する（任意）

function FirstBox() {
  return <div id="firstbox">
    <button type="button" className="basebtn">
      <img src="src/icons/pen.svg" alt="ペンアイコン" className="svg-icon" />
      ペン
    </button>
    
    <button type="button" className="basebtn">
      <img src="src/icons/eraser.svg" alt="消しゴムアイコン" className="svg-icon" />
      消しゴム
    </button>
    <button type="button" className="basebtn">
      <img src="src/icons/lasso.svg" alt="投げ縄選択アイコン" className="svg-icon btn-selected" />
      投げ縄選択
    </button>
  
    {/* <button type="button" className="basebtn">
      <img src="src/icons/ban.svg" alt="選択用アイコン" className="svg-icon btn-selected " />
    </button> */}
  </div>;
}

function SecondBox() {
  return <div id="secondbox">
    <button type="button" className="basebtn">
      <img src="src/icons/trash-2.svg" alt="リセットアイコン" className="svg-icon" />
      リセット
    </button>
    <button type="button" className="basebtn">
      <img src="src/icons/undo-2.svg" alt="元に戻すアイコン" className="svg-icon" />
      元に戻す
    </button>
  </div>;
}
