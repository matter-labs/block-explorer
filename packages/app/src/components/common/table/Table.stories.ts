import Table from "./Table.vue";
import ContentLoader from "../loaders/ContentLoader.vue";

export default {
  title: "Common/Table",
  component: Table,
};

type Args = {
  headers: string[];
  items: string[];
  loading: boolean;
  footer: undefined | string;
};

const Template = (args: Args) => ({
  components: { Table, ContentLoader },
  subcomponents: { ContentLoader },
  setup() {
    return { ...args };
  },
  template: `
    <Table :loading="loading" :items="items">
      <template #table-head>
        <th v-for="(colItem, colIndex) in headers" :key="colIndex" class="py-3 px-6 text-left text-xs font-medium uppercase tracking-wider text-gray-700">{{ colItem }}</th>
      </template>
      <template #table-row="{ item }">
        <td v-for="(colItem, colIndex) in Math.max(1, headers.length)" :key="colIndex" class="whitespace-nowrap py-4 px-6 text-sm text-gray-600">{{ item }}</td>
      </template>
      <template v-if="footer" #footer>
        <div class="text-gray-500 text-center py-2" v-html="footer"></div>
      </template>
      <template #loading>
        <tr v-for="row in 5" :key="row">
          <td class="py-3 px-6" v-for="(colItem, colIndex) in headers" :key="colIndex">
            <ContentLoader class="h-6 w-full" />
          </td>
        </tr>
      </template>
    </Table>
  `,
});

export const WithHeader = Template.bind({}) as unknown as { args: Args };
WithHeader.args = {
  headers: ["Header 1"],
  items: ["Row 1", "Row 2", "Row 3"],
  loading: false,
  footer: undefined,
};

export const WithHeaderAndFooter = Template.bind({}) as unknown as { args: Args };
WithHeaderAndFooter.args = {
  headers: ["Header 1"],
  items: ["Row 1", "Row 2", "Row 3"],
  loading: false,
  footer: "I am footer",
};

export const NoHeaderNoFooter = Template.bind({}) as unknown as { args: Args };
NoHeaderNoFooter.args = {
  headers: [],
  items: ["Row 1", "Row 2", "Row 3"],
  loading: false,
  footer: undefined,
};

export const NoHeaderWithFooter = Template.bind({}) as unknown as { args: Args };
NoHeaderWithFooter.args = {
  headers: [],
  items: ["Row 1", "Row 2", "Row 3"],
  loading: false,
  footer: "I am footer",
};

export const Loading = Template.bind({}) as unknown as { args: Args };
Loading.args = {
  headers: ["Header 1", "Header 2", "Header 3"],
  items: [],
  loading: true,
  footer: undefined,
};
