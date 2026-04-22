import PoliceOfficerRegistrationForm from "./PoliceOfficerRegistrationForm";

function EditPoliceOfficer({ officerId, onBack }) {
  return (
    <PoliceOfficerRegistrationForm
      officerId={officerId}
      onBack={onBack}
      mode="edit"
    />
  );
}

export default EditPoliceOfficer;
