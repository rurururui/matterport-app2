import { setupSdk, MpSdk } from "@matterport/sdk";
import { addTagViaGraphQL, createBasicAuthToken } from "./tagService";

// 環境変数を設定
const sdkKey = import.meta.env.VITE_MATTERPORT_SDK_KEY;
const spaceId = import.meta.env.VITE_MATTERPORT_MODEL_SID;
const modelSid = import.meta.env.VITE_MATTERPORT_MODEL_SID;
const username = import.meta.env.VITE_MATTERPORT_USERNAME;
const password = import.meta.env.VITE_MATTERPORT_PASSWORD;

let sdk: MpSdk;
let intersectionCache: any;
let poseCache: any;
let delayBeforeShow = 1000;
let buttonDisplayed = false;

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

main();

async function main() {
  // SDKを初期化
  sdk = await setupSdk(sdkKey, {
    space: spaceId,
    container: viewer,
  });
  // SDK初期化時に挿入されたiframeを取得
  iframe = document.getElementById("mp-showcase");
  // タグ一覧取得
  sdk.Mattertag.getData().then((tags) => {
    renderTags(tags);
  });
  // 「タグ追加」ボタンクリックでモーダル開く
  addTagButton.addEventListener("click", () => {
    alert("タグを追加する位置にカーソルを移動してください。");
    // カーソル位置を取得するイベントを設定
    setupPointerListener(sdk);
  });
  fixButton.addEventListener("click", () => {
    fixButton.style.display = "none";
    // モーダルを表示
    tagLabelInput.value = "";
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  });
  // 「キャンセル」でモーダル閉じる
  cancelModalButton.addEventListener("click", () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  });
  // 「保存」でタグ作成
  saveModalButton.addEventListener("click", async () => {
    const label = tagLabelInput.value.trim();
    if (label) {
      try {
        const basicAuthToken = createBasicAuthToken(username, password);
        await addTagViaGraphQL(
          basicAuthToken,
          modelSid,
          "tsmq1wak12rhgn0mawksxcwcd",
          label
          // lastClickedPosition.x,
          // lastClickedPosition.y,
          // lastClickedPosition.z
        );
        alert("Tag created successfully!");
      } catch (error) {
        console.error(error);
        alert("Failed to create tag.");
      }
    }
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  });
}

// タグ一覧テーブルを作成
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

    // イベント登録
    document.querySelectorAll(".edit-button").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const target = e.currentTarget as HTMLButtonElement;
        const sid = target.dataset.id!;
        const currentLabel = target.dataset.label!;
        const newLabel = prompt("Enter new label:", currentLabel);
        if (newLabel) {
          // await sdk.Mattertag.edit({ sid, label: newLabel });
          const updatedTags = await sdk.Mattertag.getData();
          renderTags(updatedTags);
        }
      });
    });

    document.querySelectorAll(".delete-button").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const target = e.currentTarget as HTMLButtonElement;
        const sid = target.dataset.id!;
        const confirmed = confirm("Are you sure you want to delete this tag?");
        if (confirmed) {
          await sdk.Mattertag.remove([sid]);
          const updatedTags = await sdk.Mattertag.getData();
          renderTags(updatedTags);
        }
      });
    });
  }
}

async function setupPointerListener(sdk: MpSdk) {
  sdk.Camera.pose.subscribe((pose) => {
    poseCache = pose;
  });
  sdk.Pointer.intersection.subscribe((intersection) => {
    console.log(intersection);
    intersectionCache = intersection;
    intersectionCache.time = new Date().getTime();
    buttonDisplayed = false;
  });
  setInterval(() => {
    if (!intersectionCache || !poseCache) return;
    const nextShow = intersectionCache.time + delayBeforeShow;
    if (new Date().getTime() > nextShow) {
      if (buttonDisplayed) return;
      if (iframe === null) return;
      // iframeのサイズを取得
      let size = {
        w: iframe.clientWidth,
        h: iframe.clientHeight,
      };
      // iframeのサイズとカーソル位置をもとに、iframe内の座標を取得
      let coord = sdk.Conversion.worldToScreen(
        intersectionCache.position,
        poseCache,
        size
      );
      // iframeのサイズに合わせてボタン位置を微調整する
      fixButton.style.left = `${coord.x - 50}px`;
      fixButton.style.top = `${coord.y + 75}px`;
      fixButton.style.display = "block";
      buttonDisplayed = true;
    }
  }, 5);
}
