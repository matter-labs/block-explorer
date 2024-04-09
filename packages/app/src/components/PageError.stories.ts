import PageError from "./PageError.vue";

export default {
  title: "components/PageError",
  component: PageError,
};

const Template = () => ({
  components: { PageError },
  template: `<PageError />`,
});

export const Default = Template.bind({});
