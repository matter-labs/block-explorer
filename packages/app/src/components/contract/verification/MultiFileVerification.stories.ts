import MultiFileVerification from "./MultiFileVerification.vue";

export default {
  title: "Contract/Verification/MultiFileVerification",
  component: MultiFileVerification,
};

const Template = () => ({
  components: { MultiFileVerification },
  template: `<MultiFileVerification />`,
});

export const Default = Template.bind({}) as unknown;
