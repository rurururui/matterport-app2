import { setupSdk, MpSdk } from "@matterport/sdk";
import { addTagViaGraphQL, createBasicAuthToken } from "./tagService";

// 環境変数から設定値を取得
const sdkKey = import.meta.env.VITE_MATTERPORT_SDK_KEY;
const spaceId = import.meta.env.VITE_MATTERPORT_MODEL_SID;
const modelSid = import.meta.env.VITE_MATTERPORT_MODEL_SID;
const username = import.meta.env.VITE_MATTERPORT_USERNAME;
const password = import.meta.env.VITE_MATTERPORT_PASSWORD;

// SDK関連のキャッシュや制御変数
let sdk: MpSdk;
let currentFloor: string;
let intersectionCache: any; // 最後に検出された交差情報
let poseCache: any; // カメラの姿勢情報
let delayBeforeShow = 1000; // ボタン表示までの遅延（ミリ秒）
let buttonDisplayed = false; // 座標決定ボタンの表示状態

// DOM要素の参照を取得
let iframe: HTMLElement | null;
const viewer = document.getElementById("matterport-viewer") as HTMLDivElement;
const fixButton = document.getElementById(
  "fix-position-button"
) as HTMLButtonElement;
const addTagButton = document.getElementById("add-tag")!;
const modal = document.getElementById("modal")!;
const cancelModalButton = document.getElementById("cancel-modal")!;
const saveModalButton = document.getElementById("save-modal")!;
const tagLabelInput = document.getElementById(
  "tag-label-input"
) as HTMLInputElement;

// アプリケーションのメイン処理を開始
main();

async function main() {
  // Matterport SDKの初期化
  sdk = await setupSdk(sdkKey, {
    space: spaceId,
    container: viewer,
  });

  // 自動的に挿入されるiframe要素を取得
  iframe = document.getElementById("mp-showcase");

  // 現在のフロア情報を取得
  sdk.Floor.current.subscribe((floor) => {
    if (floor.id) {
      currentFloor = floor.id;
      console.log(floor.id);
    }
  });

  // 既存のMattertag（タグ）一覧を取得して表示
  sdk.Mattertag.getData().then((tags) => {
    renderTags(tags);
  });

  // 「タグ追加」ボタンのクリックで、ポインタリスナーを有効化
  addTagButton.addEventListener("click", () => {
    alert("タグを追加する位置にカーソルを移動してください。");
    setupPointerListener(sdk);
  });

  // 「座標決定」ボタンでモーダルを表示
  fixButton.addEventListener("click", () => {
    fixButton.style.display = "none";
    tagLabelInput.value = "";
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  });

  // モーダルの「キャンセル」ボタンで閉じる
  cancelModalButton.addEventListener("click", () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  });

  // モーダルの「保存」ボタンでタグ作成処理を実行
  saveModalButton.addEventListener("click", async () => {
    const label = tagLabelInput.value.trim();
    if (label) {
      try {
        const basicAuthToken = createBasicAuthToken(username, password);
        await addTagViaGraphQL(
          basicAuthToken,
          modelSid,
          currentFloor,
          label,
          intersectionCache.position.x,
          -intersectionCache.position.z,
          intersectionCache.position.y
        );
        alert("タグが正常に作成されました。");
      } catch (error) {
        console.error(error);
        alert("タグの作成に失敗しました。");
      }
    }
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  });
}

// タグ一覧をHTMLテーブルとして描画
function renderTags(tags: any[]) {
  const list = document.getElementById("tag-list");
  if (list) {
    list.innerHTML = `
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm text-gray-300 bg-gray-800 rounded-lg shadow-lg">
          <thead class="text-xs uppercase bg-gray-700 text-gray-400">
            <tr>
              <th class="px-6 py-3 text-left">Label</th>
              <th class="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700">
            ${tags
              .map(
                (tag) => `
              <tr class="hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap">${tag.label}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <button class="edit-button text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded mr-2" data-id="${tag.sid}" data-label="${tag.label}">
                    Edit
                  </button>
                  <button class="delete-button text-xs bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded" data-id="${tag.sid}">
                    Delete
                  </button>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    // 編集ボタンのクリックイベント
    document.querySelectorAll(".edit-button").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const target = e.currentTarget as HTMLButtonElement;
        const sid = target.dataset.id!;
        const currentLabel = target.dataset.label!;
        const newLabel = prompt(
          "新しいラベルを入力してください：",
          currentLabel
        );
        if (newLabel) {
          // ここで編集APIを呼び出すことも可能（コメントアウト中）
          // await sdk.Mattertag.edit({ sid, label: newLabel });
          const updatedTags = await sdk.Mattertag.getData();
          renderTags(updatedTags);
        }
      });
    });

    // 削除ボタンのクリックイベント
    document.querySelectorAll(".delete-button").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const target = e.currentTarget as HTMLButtonElement;
        const sid = target.dataset.id!;
        const confirmed = confirm("このタグを削除してもよいですか？");
        if (confirmed) {
          await sdk.Mattertag.remove([sid]);
          const updatedTags = await sdk.Mattertag.getData();
          renderTags(updatedTags);
        }
      });
    });
  }
}

// ポインタとカメラの情報をもとに「座標決定ボタン」の表示制御
async function setupPointerListener(sdk: MpSdk) {
  // カメラの姿勢情報を取得
  sdk.Camera.pose.subscribe((pose) => {
    poseCache = pose;
  });

  // ポインタが指している3D空間上の交差点を取得
  sdk.Pointer.intersection.subscribe((intersection) => {
    console.log(intersection);
    intersectionCache = intersection;
    intersectionCache.time = new Date().getTime();
    buttonDisplayed = false;
  });

  // 定期的に交差点を監視し、一定時間静止していたら「座標決定」ボタンを表示
  setInterval(() => {
    if (!intersectionCache || !poseCache) return;
    const nextShow = intersectionCache.time + delayBeforeShow;
    if (new Date().getTime() > nextShow) {
      if (buttonDisplayed) return;
      if (iframe === null) return;

      // iframeの大きさを取得
      let size = {
        w: iframe.clientWidth,
        h: iframe.clientHeight,
      };

      // 交差点の3D座標を画面座標に変換
      let coord = sdk.Conversion.worldToScreen(
        intersectionCache.position,
        poseCache,
        size
      );

      // ボタンの表示位置を計算して表示
      fixButton.style.left = `${coord.x - 50}px`;
      fixButton.style.top = `${coord.y + 75}px`;
      fixButton.style.display = "block";
      buttonDisplayed = true;
    }
  }, 5);
}
