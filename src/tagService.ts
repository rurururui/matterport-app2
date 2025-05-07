const GRAPHQL_ENDPOINT = "https://api.matterport.com/api/models/graph";

export function createBasicAuthToken(
  username: string,
  password: string
): string {
  const credentials = `${username}:${password}`;
  const encoded = btoa(credentials); // Base64エンコード
  return encoded;
}

/**
 * タグをGraphQL API経由で追加する
 * @param basicAuthToken Base64エンコードされた "username:password"
 * @param modelId 追加するモデルID（スペースID）
 * @param floorId フロアID（仮に空文字を指定してもOK）
 * @param label タグのラベル
 * @param description タグの説明（任意）
 */
export async function addTagViaGraphQL(
  basicAuthToken: string,
  modelId: string,
  floorId: string,
  label: string,
  anchorPositionX: number,
  anchorPositionY: number,
  anchorPositionZ: number
) {
  // GraphQL ミューテーション文字列
  const query = `
    mutation addTag(
      $modelId: ID!,
      $floorId: ID!,
      $color: String,
      $description: String,
      $label: String,
      $icon: String,
      $keywords: [String!],
      $enabled: Boolean!,
      $anchorPositionX: Float!,
      $anchorPositionY: Float!,
      $anchorPositionZ: Float!,
      $stemEnabled: Boolean!,
      $stemNormalX: Float!,
      $stemNormalY: Float!,
      $stemNormalZ: Float!,
      $mediaType: MattertagMediaType,
      $mediaUrl: String,
      $stemLength: Float!
    ) {
      addMattertag(
        modelId: $modelId,
        field: id,
        mattertag: {
          floorId: $floorId,
          enabled: $enabled,
          color: $color,
          label: $label,
          icon: $icon,
          keywords: $keywords,
          description: $description,
          anchorPosition: {
            x: $anchorPositionX,
            y: $anchorPositionY,
            z: $anchorPositionZ
          },
          mediaType: $mediaType,
          mediaUrl: $mediaUrl,
          stemEnabled: $stemEnabled,
          stemNormal: {
            x: $stemNormalX,
            y: $stemNormalY,
            z: $stemNormalZ
          },
          stemLength: $stemLength
        }
      ) {
        id
      }
    }
  `;

  // 送信する変数
  const variables = {
    modelId,
    floorId,
    color: "#0000FF",
    description: "テストタグ",
    label,
    icon: "info",
    keywords: ["test"],
    enabled: true,
    anchorPositionX: anchorPositionX,
    anchorPositionY: anchorPositionY,
    anchorPositionZ: anchorPositionZ,
    stemEnabled: true,
    stemNormalX: 0,
    stemNormalY: 0,
    stemNormalZ: 1,
    mediaType: null,
    mediaUrl: null,
    stemLength: 0.3,
  };

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuthToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to create tag: ${response.statusText} - ${errorText}`
    );
  }

  const json = await response.json();
  return json.data.addMattertag;
}
