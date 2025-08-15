// Local stub for AI suggestions, returns placeholder data without external API calls.
export const suggestEntityDetails = async (
  entityType: string,
  entityName: string
): Promise<any> => {
  return {
    name: entityName,
    description: `Placeholder description for ${entityName}, a type of ${entityType}.`,
    sensors: [
      {
        name: 'Placeholder Sensor',
        type: 'Other',
        range: { value: 0, unit: 'km' },
      },
    ],
    weapons: [
      {
        name: 'Placeholder Weapon',
        type: 'Other',
        range: { value: 0, unit: 'km' },
        maxQuantity: 0,
      },
    ],
  };
};
