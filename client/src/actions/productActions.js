// Basic productActions.js for Redux Thunk
import axios from "axios";

export const createProduct = (formData) => async (dispatch) => {
  try {
    dispatch({ type: "PRODUCT_CREATE_REQUEST" });
    const config = { headers: { "Content-Type": "multipart/form-data" } };
    const { data } = await axios.post("https://furniture-q3nb.onrender.com/api/products", formData, config);
    dispatch({ type: "PRODUCT_CREATE_SUCCESS", payload: data });
  } catch (error) {
    dispatch({
      type: "PRODUCT_CREATE_FAIL",
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};
