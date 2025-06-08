import Swal from "sweetalert2";

export function showSuccessAlert(message = "Product added successfully!") {
  Swal.fire({
    icon: "success",
    title: "Success",
    text: message,
    timer: 1800,
    showConfirmButton: false,
    position: "top-end",
    toast: true,
    background: "#fff",
  });
}
