import Table from "./Table.vue";
import TableHeadColumn from "./TableHeadColumn.vue";

export default {
  title: "Common/Table/TableHeadColumn",
  component: Table,
};

type Args = {
  headers: string[];
  items: string[];
};

const Template = (args: Args) => ({
  components: { Table, TableHeadColumn },
  subcomponents: { TableHeadColumn },
  setup() {
    return { ...args };
  },
  template: `
    <Table :items="items">
      <template #table-head>
        <TableHeadColumn v-for="(colItem, colIndex) in headers" :key="colIndex">{{ colItem }}</TableHeadColumn>
      </template>
      <template #table-row="{ item }">
        <td v-for="(colItem, colIndex) in headers" :key="colIndex" class="whitespace-nowrap py-4 px-6 text-sm text-gray-600">{{ item }}</td>
      </template>
    </Table>
  `,
});

export const Default = Template.bind({}) as unknown as { args: Args };
Default.args = {
  headers: ["Header 1"],
  items: ["Row 1", "Row 2", "Row 3"],
};
