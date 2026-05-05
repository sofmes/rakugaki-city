interface HomeProps {
  ownRoomPath: string;
}

/** トップページに表示する、最小限のホーム画面。 */
export default function Home({ ownRoomPath }: HomeProps) {
  return (
    <main class="home">
      <h1>落書きシティ</h1>

      <p>
        図解のための、URLで共有できる、シンプルお絵描きチャット
        <br />
        キャンバスは閉じて10分するとリセットされます
      </p>

      <a class="home-room-link" href={ownRoomPath}>
        自分の部屋を開く
      </a>

      <div style="position: absolute; right: 16px; top: 12px;">
        <a href="https://github.com/sofmes/rakugaki-city">GitHubリポジトリ</a>
      </div>
    </main>
  );
}
