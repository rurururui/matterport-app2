import { setupSdk, MpSdk } from "@matterport/sdk";
import { addTagViaGraphQL, createBasicAuthToken } from "./tagService";

// 環境変数を設定
const sdkKey = import.meta.env.VITE_MATTERPORT_SDK_KEY;
const spaceId = import.meta.env.VITE_MATTERPORT_MODEL_SID;
const modelSid = import.meta.env.VITE_MATTERPORT_MODEL_SID;
const username = import.meta.env.VITE_MATTERPORT_USERNAME;
const password = import.meta.env.VITE_MATTERPORT_PASSWORD;

let sdk: MpSdk;
let hoveredPosition: { x: number; y: number; z: number } | null = null;
let mouseMoveTimer: any = null;

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
  // カーソル位置を取得するイベントを設定
  setupPointerListener(sdk);
  // タグ一覧取得
  sdk.Mattertag.getData().then((tags) => {
    renderTags(tags);
  });
  // 「タグ追加」ボタンクリックでモーダル開く
  addTagButton.addEventListener("click", () => {
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
  sdk.Pointer.intersection.subscribe((intersectionData: any) => {
    hoveredPosition = intersectionData?.position ?? null;
    // マウス動いたらタイマーリセット
    if (mouseMoveTimer) {
      clearTimeout(mouseMoveTimer);
    }
    // 500ms止まったらボタン表示
    mouseMoveTimer = setTimeout(() => {
      if (hoveredPosition) {
        showFixButton(intersectionData.position);
      }
    }, 500);
  });
}

// ボタンを画面上に表示
function showFixButton(screenPos: { x: number; y: number }) {
  if (!fixButton) return;
  const buttonWidth = 120; // ボタンの幅をだいたい予測（px）
  const buttonHeight = 40; // ボタンの高さも予測（px）
  // クリックしたカーソル位置からボタンの中心がカーソルに合うように調整
  fixButton.style.left = `${screenPos.x - buttonWidth / 2}px`;
  fixButton.style.top = `${screenPos.y - buttonHeight - 10}px`; // 10pxだけカーソル上に浮かせる
  fixButton.classList.remove("hidden");
}
