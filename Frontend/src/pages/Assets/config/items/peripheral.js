import { common } from "../common.js";
import { fromGeneric } from "../sectionManager.js";

export const lookupOptions = {
  category: (categoryName) => ({ __lookupCategory: String(categoryName || "").trim().toLowerCase() }),
};

export const peripheralConfigs = {

  //todo Camera Configuration
  camera: {
    sections: [


       //! Basic Information
      fromGeneric("Basic Information", {
        // Example: hide description field coming from generic
        omitFields: ["assetDescription", "barcode","assetName","assetCategory","assetType","brand","assetCondition",],
        overrideFields: [{          name: "assetId", readOnly: true, placeholder: "Auto-generated on save", required: false
        }, {          name: "assetSubType",
          label: "Sub Type",
          placeholder: "Select Camera Type",
          type: "select",
          options: lookupOptions.category("camera_type"),
          required: true,
        },  ],
        // addFields: [
        //   {
        //     name: "assetSubType",
        //     label: "Camera Type",
        //     type: "select",
        //     options: lookupOptions.category("camera_type"),
        //   },
        // ],
      }),
      //! Location Information
     fromGeneric("Location & Other Information",{
         omitFields: ["organization","rackNumber","rackUnit", "location", "floor", "room", "locationType", "building"],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
        }),

      //! Camera Specifications
      {
        sectionTitle: "Camera Specifications",
        fields: [
          {
            name: "resolution",
            label: "Maximum Resolution",
            type: "select",
            options: lookupOptions.category("resolution"),
          },
          { name: "frameRate", label: "Frame Rate (FPS)", type: "number", min: 0, max: 240, placeholder: "e.g. 30" },
          // {
          //   name: "sensorType",
          //   label: "Sensor Type",
          //   type: "select",
          //   options: [
          //     { value: "CMOS", label: "CMOS" },
          //     { value: "CCD", label: "CCD" },
          //   ],
          // },
          { name: "fieldOfView", label: "Field of View (Degrees)", type: "number", min: 0, max: 180, placeholder: "e.g. 90" },
          { name: "autoFocus", label: "Auto Focus", type: "select", options: common.booleanOptions, defaultValue: "Yes" },
        ],
      },


      //! Audio Features
      {
        sectionTitle: "Audio Features",
        fields: [
          { name: "builtInMicrophone", label: "Built-in Microphone", type: "select", options: common.booleanOptions, defaultValue: "Yes" },
          { name: "microphoneType", label: "Microphone Type", type: "text", maxLength: 80, showIf: { builtInMicrophone: "Yes", placeholder: "e.g. Array" } }, // Could be select with options like "Omnidirectional", "Unidirectional", "Bidirectional", "Array", etc. if you want to standardize input
          { name: "noiseReduction", label: "Noise Reduction", type: "select", options: common.booleanOptions, showIf: { builtInMicrophone: "Yes" } }, 
        ],
      },
      //! Connectivity
      {
        sectionTitle: "Connectivity",
        fields: [
          {
            name: "connectionType",
            label: "Connection Type",
            type: "select",
            options: [
              { value: "USB", label: "USB" },
              { value: "USB-C", label: "USB-C" },
              { value: "Wireless", label: "Wireless" },
            ],
          },
          // { name: "cableLength", label: "Cable Length (meters)", type: "number", min: 0, max: 10, showIf: { connectionType: ["USB", "USB-C"] }   },
          { name: "plugAndPlay", label: "Plug and Play Support", type: "select", options: common.booleanOptions, showIf: { connectionType: ["USB", "USB-C"] }, defaultValue: "Yes" },
        ],
      },
      {
        sectionTitle: "Mounting & Physical",
        fields: [
          {
            name: "mountType",
            label: "Mount Type",
            type: "select",
            options: [
              { value: "Monitor Clip", label: "Monitor Clip" },
              { value: "Tripod", label: "Tripod Mount" },
              { value: "Wall", label: "Wall Mount" },
            ],
          },
          { name: "color", label: "Color", type: "text", maxLength: 40, placeholder: "e.g. Black" },
        ],
      },
      //! Purchase Information
      fromGeneric("Purchase Information",{
         omitFields: [],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
      }),
      //! Warranty Information
      fromGeneric("Warranty Information",{
        //  omitFields: ["","",""],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
      }),

      //! Asset State
      fromGeneric("Asset State",{
        //  omitFields: ["","",""],
        //  overrideFields: [{},{},{},],
        //  addFields:[{},{},{},]
      }),
    ],
  },



};


