export default function UITest() {
	return <div id="mainbox">
    <div id="firstbox">
    <button type="button" className="basebtn">
      <img src="src/icons/pen.svg" alt="ペンアイコン" />
      ペン
      </button>
    <button type="button" className="basebtn">
      <img src="src/icons/eraser.svg" alt="消しゴムアイコン" className="svg-icon" />
      消しゴム
      </button>
    <button type="button" className="basebtn">
      <img src="src/icons/lasso.svg" alt="投げ縄選択アイコン" className="svg-icon" />
      投げ縄選択
      </button>
    
    <button type="button" className="btn-selected">
      <img src="src/icons/ban.svg" alt="選択用アイコン" className="svg-icon" />
    </button>
  </div>
  <div id="secondbox">
    <button type="button" className="basebtn">
      <img src="src/icons/trash-2.svg" alt="リセットアイコン" className="svg-icon" />
      リセット
    </button>
    <button type="button" className="basebtn">
      <img src="src/icons/undo-2.svg" alt="元に戻すアイコン" className="svg-icon" />
      元に戻す
    </button>
  </div>
  </div>
}
