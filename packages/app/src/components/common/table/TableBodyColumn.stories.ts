import Table from "./Table.vue";
import TableBodyColumn from "./TableBodyColumn.vue";

export default {
  title: "Common/Table/TableBodyColumn",
  component: Table,
};

type Args = {
  headers: string[];
  items: string[];
};

const Template = (args: Args) => ({
  components: { Table, TableBodyColumn },
  subcomponents: { TableBodyColumn },
  setup() {
    return { ...args };
  },
  template: `
    <Table :items="items">
      <template #table-head>
        <th v-for="(colItem, colIndex) in headers" :key="colIndex" class="py-3 px-6 text-left text-xs font-medium uppercase tracking-wider text-gray-700">{{ colItem }}</th>
      </template>
      <template #table-row="{ item }">
        <TableBodyColumn v-for="(colItem, colIndex) in headers" :key="colIndex">{{ item }}</TableBodyColumn>
      </template>
    </Table>
  `,
});

export const Default = Template.bind({}) as unknown as { args: Args };
Default.args = {
  headers: ["Header 1"],
  items: ["Row 1", "Row 2", "Row 3"],
};
